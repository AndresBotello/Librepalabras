import { v2 as cloudinary } from 'cloudinary';
import { adminDb } from '../config/firebaseAdmin.js';
import { countErrorsSince, listRecentErrors } from './errorLog.service.js';

/**
 * Estado operativo de la plataforma: cuánto queda de cuota, qué colecciones
 * están creciendo, qué ha fallado últimamente y qué archivos se quedaron
 * huérfanos en Cloudinary.
 *
 * Cada bloque se resuelve por separado y ninguno puede tumbar al resto: si
 * Cloudinary no responde, el panel sigue mostrando Firestore y los errores.
 * Por eso se usa `allSettled` y cada sección lleva su propio `ok`.
 *
 * A propósito NO se informa de la configuración del despliegue: ni proveedores,
 * ni nombres de cuenta, ni dominios, ni versiones, ni memoria. Nada de eso hace
 * falta para operar la plataforma y todo ello describe la infraestructura a
 * quien lo lea. Si algún día vuelve a hacer falta un indicador de "esto está
 * conectado", que sea un booleano y nunca el valor que lo configura.
 */

const CLOUDINARY_FOLDER = 'librepalaras';

export async function getSystemHealth() {
  const [storage, database, errors, orphans] = await Promise.allSettled([
    getCloudinaryUsage(),
    getDatabaseStats(),
    getErrorSummary(),
    findOrphanFiles(),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    storage: unwrap(storage, 'No se pudo consultar Cloudinary'),
    database: unwrap(database, 'No se pudo consultar Firestore'),
    errors: unwrap(errors, 'No se pudo leer el registro de errores'),
    orphanFiles: unwrap(orphans, 'No se pudo comparar los archivos'),
  };
}

function unwrap(result, fallbackMessage) {
  if (result.status === 'fulfilled') {
    return { ok: true, ...result.value };
  }

  return { ok: false, message: fallbackMessage, error: result.reason?.message || String(result.reason) };
}

async function getCloudinaryUsage() {
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary no está configurado');
  }

  const usage = await cloudinary.api.usage();

  // El plan gratuito razona en "créditos": 1 crédito ≈ 1.000 transformaciones,
  // 1 GB de almacenamiento o 1 GB de tráfico. Es la cifra que de verdad avisa
  // de que se acerca el límite, más que los bytes sueltos.
  const credits = usage.credits || {};

  return {
    plan: usage.plan || 'Desconocido',
    creditsUsed: round(credits.usage),
    creditsLimit: round(credits.limit),
    creditsPercent: credits.used_percent != null ? round(credits.used_percent) : null,
    storageBytes: usage.storage?.usage || 0,
    bandwidthBytes: usage.bandwidth?.usage || 0,
    resourceCount: usage.resources || 0,
    derivedCount: usage.derived_resources || 0,
  };
}

function round(value) {
  return typeof value === 'number' ? Math.round(value * 100) / 100 : null;
}

/**
 * Conteos por colección con la agregación `count()` de Firestore: el número lo
 * calcula el servidor y no se descarga ni un documento, así que abrir el panel
 * de salud no cuesta una lectura por obra.
 */
async function getDatabaseStats() {
  if (!adminDb) {
    throw new Error('Firestore no está disponible');
  }

  const collections = [
    'users',
    'literature',
    'contestStories',
    'poliversia',
    'promotionalBooks',
    'notifications',
    'commentReports',
    'invitations',
  ];

  const counts = await Promise.all(
    collections.map(async (name) => {
      try {
        const snapshot = await adminDb.collection(name).count().get();
        return [name, snapshot.data().count];
      } catch {
        // Una colección que aún no existe no es un fallo: simplemente está a cero.
        return [name, 0];
      }
    })
  );

  return { collections: Object.fromEntries(counts) };
}

async function getErrorSummary() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [recent, last24h, last7d] = await Promise.all([
    listRecentErrors(15),
    countErrorsSince(dayAgo),
    countErrorsSince(weekAgo),
  ]);

  return { recent, last24h, last7d };
}

/**
 * Archivos que quedaron en Cloudinary sin ningún documento que los referencie:
 * subidas interrumpidas, obras borradas, portadas reemplazadas. Cada uno sigue
 * consumiendo cuota sin que nadie pueda verlo desde la plataforma.
 *
 * Se comparan URLs completas contra los campos que las guardan. La lista de
 * Cloudinary se pide acotada porque `resources` pagina de 500 en 500 y el panel
 * solo necesita una muestra representativa, no un inventario exhaustivo.
 */
async function findOrphanFiles() {
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary no está configurado');
  }

  if (!adminDb) {
    throw new Error('Firestore no está disponible');
  }

  const [imageResources, rawResources] = await Promise.all([
    listCloudinaryResources('image'),
    listCloudinaryResources('raw'),
  ]);

  const resources = [...imageResources, ...rawResources];
  const referenced = await collectReferencedUrls();

  const orphans = resources
    .filter((resource) => !referenced.has(resource.secure_url))
    .map((resource) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format || '',
      resourceType: resource.resource_type,
      bytes: resource.bytes || 0,
      createdAt: resource.created_at,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    total: orphans.length,
    totalBytes: orphans.reduce((sum, item) => sum + item.bytes, 0),
    scanned: resources.length,
    // Solo se devuelve una tanda: la lista completa no cabe en una pantalla y
    // el admin actúa sobre los más pesados, que son los que van primero.
    items: orphans.slice(0, 30),
  };
}

async function listCloudinaryResources(resourceType) {
  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: CLOUDINARY_FOLDER,
      resource_type: resourceType,
      max_results: 500,
    });

    return response.resources || [];
  } catch (error) {
    console.error(`No se pudieron listar recursos ${resourceType} de Cloudinary:`, error.message);
    return [];
  }
}

/** Todas las URLs de Cloudinary que algún documento tiene guardadas. */
async function collectReferencedUrls() {
  const sources = [
    { collection: 'literature', fields: ['pdfUrl', 'cover'] },
    { collection: 'poliversia', fields: ['pdfUrl', 'coverUrl', 'cover'] },
    { collection: 'promotionalBooks', fields: ['cover', 'coverUrl', 'pdfUrl'] },
    { collection: 'users', fields: ['photoURL'] },
    { collection: 'siteConfig', fields: ['heroImage'] },
  ];

  const referenced = new Set();

  await Promise.all(
    sources.map(async ({ collection, fields }) => {
      try {
        // `select` trae solo los campos con URLs: sin él, escanear `literature`
        // descargaría el texto completo de cada obra.
        const snapshot = await adminDb.collection(collection).select(...fields).get();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          fields.forEach((field) => {
            if (typeof data[field] === 'string' && data[field]) {
              referenced.add(data[field]);
            }
          });
        });
      } catch (error) {
        console.error(`No se pudo escanear ${collection}:`, error.message);
      }
    })
  );

  return referenced;
}
