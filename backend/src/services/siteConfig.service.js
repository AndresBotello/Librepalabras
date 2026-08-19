import { randomUUID } from 'node:crypto';
import { adminDb } from '../config/firebaseAdmin.js';

/**
 * Dos documentos únicos en `siteConfig`: los ajustes operativos (`settings`) y
 * el contenido editable de la portada (`home`).
 *
 * El middleware de mantenimiento consulta los ajustes en CADA petición, así que
 * leer Firestore cada vez multiplicaría por dos el coste de todo el backend.
 * Se cachean en memoria con un TTL corto y se invalidan al guardar: un cambio
 * del admin se aplica al instante en el proceso que lo atendió, y como mucho
 * TTL segundos más tarde en el resto.
 */

const COLLECTION = 'siteConfig';
const SETTINGS_DOC = 'settings';
const HOME_DOC = 'home';
const CACHE_TTL = 15000;

export const DEFAULT_SETTINGS = {
  siteTitle: 'Liberapalabras',
  maintenanceMode: false,
  maintenanceMessage: 'Estamos realizando tareas de mantenimiento. Volvemos en unos minutos.',
  maxUploadMb: 10,
  autoModeration: true,
  allowRegistrations: true,
};

/**
 * Los textos van vacíos a propósito. Un campo vacío significa "no configurado",
 * y la portada usa entonces su diseño original. Así, hasta que el admin escriba
 * algo, el sitio se ve exactamente igual que antes de existir esta función.
 */
export const DEFAULT_HOME = {
  heroTitle: '',
  heroSubtitle: '',
  heroImage: '',
  heroCtaLabel: '',
  heroCtaLink: '/stories',
  announcementText: '',
  announcementActive: false,
  editorialActive: false,
  editorialKicker: '',
  editorialTitle: '',
  editorialEpigraph: '',
  editorialBody: '',
  editorialAuthor: '',
  editorialAuthorRole: '',
  editorialFont: 'serif',
  // Vacío significa "la que diga la general". Así se cambia el bloque entero
  // tocando un solo desplegable, y solo se afina lo que haga falta afinar.
  editorialTitleFont: '',
  editorialEpigraphFont: '',
  editorialBodyFont: '',
  editorialSignatureFont: '',
  featuredWorkIds: [],
  events: [],
};

const cache = new Map();

function collection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(COLLECTION);
}

async function readDoc(docId, defaults) {
  const cached = cache.get(docId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (!adminDb) {
    return { ...defaults };
  }

  let data = { ...defaults };

  try {
    const snapshot = await collection().doc(docId).get();

    if (snapshot.exists) {
      // Los valores por defecto van debajo a propósito: si mañana se añade un
      // ajuste nuevo, los documentos ya guardados lo heredan sin migración.
      data = { ...defaults, ...snapshot.data() };
    }
  } catch (error) {
    // Si Firestore no responde, el sitio debe seguir en pie con los valores por
    // defecto antes que devolver un 500 en cada petición.
    console.error(`No se pudo leer siteConfig/${docId}:`, error.message);
  }

  cache.set(docId, { data, timestamp: Date.now() });
  return data;
}

async function writeDoc(docId, updates, defaults, updatedBy) {
  const payload = {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || null,
  };

  await collection().doc(docId).set(payload, { merge: true });
  cache.delete(docId);

  return readDoc(docId, defaults);
}

export function invalidateSiteConfigCache() {
  cache.clear();
}

export function getSettings() {
  return readDoc(SETTINGS_DOC, DEFAULT_SETTINGS);
}

export function getHomeContent() {
  return readDoc(HOME_DOC, DEFAULT_HOME);
}

/** Solo se guardan las claves conocidas, y cada una con su validación. */
export async function updateSettings(input = {}, updatedBy = null) {
  const updates = {};

  if (input.siteTitle !== undefined) {
    const value = String(input.siteTitle).trim();

    if (value.length < 2 || value.length > 60) {
      throw Object.assign(new Error('El nombre del sitio debe tener entre 2 y 60 caracteres'), { status: 400 });
    }

    updates.siteTitle = value;
  }

  if (input.maintenanceMode !== undefined) {
    if (typeof input.maintenanceMode !== 'boolean') {
      throw Object.assign(new Error('maintenanceMode debe ser true o false'), { status: 400 });
    }

    updates.maintenanceMode = input.maintenanceMode;
  }

  if (input.maintenanceMessage !== undefined) {
    updates.maintenanceMessage = String(input.maintenanceMessage).trim().slice(0, 300)
      || DEFAULT_SETTINGS.maintenanceMessage;
  }

  if (input.maxUploadMb !== undefined) {
    const value = Number(input.maxUploadMb);

    // El techo real lo pone Multer (50 MB en upload.routes.js); dejar guardar
    // más sería anunciar un límite que el servidor no acepta.
    if (!Number.isFinite(value) || value < 1 || value > 50) {
      throw Object.assign(new Error('El tamaño máximo debe estar entre 1 y 50 MB'), { status: 400 });
    }

    updates.maxUploadMb = Math.round(value);
  }

  if (input.autoModeration !== undefined) {
    if (typeof input.autoModeration !== 'boolean') {
      throw Object.assign(new Error('autoModeration debe ser true o false'), { status: 400 });
    }

    updates.autoModeration = input.autoModeration;
  }

  if (input.allowRegistrations !== undefined) {
    if (typeof input.allowRegistrations !== 'boolean') {
      throw Object.assign(new Error('allowRegistrations debe ser true o false'), { status: 400 });
    }

    updates.allowRegistrations = input.allowRegistrations;
  }

  if (Object.keys(updates).length === 0) {
    throw Object.assign(new Error('No hay ajustes que actualizar'), { status: 400 });
  }

  return writeDoc(SETTINGS_DOC, updates, DEFAULT_SETTINGS, updatedBy);
}

const MAX_FEATURED = 6;
const MAX_EVENTS = 6;
// Da para un escrito largo de verdad —el que motivó esto ronda los 6.000
// caracteres— sin que un pegado accidental de un libro entero acabe en un
// documento de Firestore, que tiene un techo duro de 1 MB.
const MAX_EDITORIAL_BODY = 20000;
// Las tres tipografías que ya carga el sitio (index.css). Es una lista cerrada
// y no un campo libre a propósito: cualquier otro valor sería una fuente que el
// navegador no tiene, y el escrito acabaría en la letra por defecto del sistema.
const EDITORIAL_FONTS = ['serif', 'display', 'sans'];

/**
 * El enlace de un evento SÍ puede salir del sitio, al revés que el botón del
 * banner: un evento vive donde vive —la inscripción, la videollamada, la
 * convocatoria del ente que lo organiza— y obligarlo a ser una ruta interna
 * dejaría la función sin sentido.
 *
 * Por eso el filtro es el protocolo: se acepta una ruta interna o una URL
 * https, y nada más. `javascript:` y `data:` parsean como URL válidas y
 * convertirían el panel en una forma de inyectar código en la portada.
 */
function parseEventLink(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed.slice(0, 500);

  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' ? url.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

function parseEventDate(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) return '';

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Cada evento se sanea campo a campo. Solo el nombre y el enlace son
 * obligatorios: son lo mínimo para promocionar algo (qué es y dónde ocurre);
 * la fecha, el lugar y la reseña enriquecen la tarjeta cuando se conocen.
 */
function parseEvents(input) {
  if (!Array.isArray(input)) {
    throw Object.assign(new Error('events debe ser una lista'), { status: 400 });
  }

  if (input.length > MAX_EVENTS) {
    throw Object.assign(new Error(`Puedes promocionar como máximo ${MAX_EVENTS} eventos`), { status: 400 });
  }

  return input.map((item, index) => {
    const position = index + 1;
    const title = String(item?.title ?? '').trim();

    if (!title) {
      throw Object.assign(new Error(`El evento ${position} necesita un nombre`), { status: 400 });
    }

    const link = parseEventLink(item?.link);

    if (!link) {
      throw Object.assign(
        new Error(`El enlace del evento ${position} debe ser una dirección https:// o una ruta interna que empiece por /`),
        { status: 400 }
      );
    }

    const date = parseEventDate(item?.date);

    if (date === null) {
      throw Object.assign(new Error(`La fecha del evento ${position} no es válida`), { status: 400 });
    }

    return {
      // El id lo pone quien crea la fila para que reordenar en el panel no
      // remonte los campos de texto; si llega vacío se genera aquí.
      id: String(item?.id ?? '').trim().slice(0, 60) || randomUUID(),
      title: title.slice(0, 120),
      link,
      date,
      place: String(item?.place ?? '').trim().slice(0, 100),
      description: String(item?.description ?? '').trim().slice(0, 300),
    };
  });
}

export async function updateHomeContent(input = {}, updatedBy = null) {
  const updates = {};

  const textFields = {
    heroTitle: 120,
    heroSubtitle: 300,
    heroCtaLabel: 40,
    announcementText: 300,
    // El epígrafe lleva la cita y su atribución en líneas distintas: `trim`
    // solo recorta los extremos, así que el salto de en medio sobrevive.
    editorialKicker: 40,
    editorialTitle: 160,
    editorialEpigraph: 400,
    editorialAuthor: 120,
    editorialAuthorRole: 120,
  };

  for (const [field, maxLength] of Object.entries(textFields)) {
    if (input[field] !== undefined) {
      updates[field] = String(input[field]).trim().slice(0, maxLength);
    }
  }

  if (input.heroCtaLink !== undefined) {
    const value = String(input.heroCtaLink).trim();

    // Solo rutas internas: un enlace absoluto en el botón principal de la
    // portada convertiría el panel de admin en un vector de phishing.
    if (value && !value.startsWith('/')) {
      throw Object.assign(new Error('El enlace del botón debe ser una ruta interna que empiece por /'), { status: 400 });
    }

    updates.heroCtaLink = value || DEFAULT_HOME.heroCtaLink;
  }

  if (input.heroImage !== undefined) {
    const value = String(input.heroImage).trim();

    if (value && !isOwnCloudinaryUrl(value)) {
      throw Object.assign(new Error('La imagen debe subirse desde el panel (URL de Cloudinary propia)'), { status: 400 });
    }

    updates.heroImage = value;
  }

  if (input.editorialBody !== undefined) {
    // La forma del escrito ES el escrito: la sangría de cada párrafo y los
    // versos citados vienen de un procesador de textos y se publican tal cual.
    // Por eso no se recorta la línea a línea, solo se normaliza el fin de línea
    // de Windows y se colapsan las tandas de más de una línea en blanco, que al
    // pintarse dejarían huecos enormes.
    //
    // El recorte de los extremos se hace a mano y no con `trim`: `trim` se
    // llevaría por delante la sangría del primer párrafo, que es justo lo que
    // hay que conservar.
    updates.editorialBody = String(input.editorialBody)
      .replace(/\r\n?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\s+$/, '')
      .slice(0, MAX_EDITORIAL_BODY);
  }

  // La general cae en la serif si se deja vacía; las de cada sección se quedan
  // vacías, que es como dicen "la que haya elegido la general".
  const fontFields = {
    editorialFont: DEFAULT_HOME.editorialFont,
    editorialTitleFont: '',
    editorialEpigraphFont: '',
    editorialBodyFont: '',
    editorialSignatureFont: '',
  };

  for (const [field, fallback] of Object.entries(fontFields)) {
    if (input[field] === undefined) continue;

    const value = String(input[field] || '').trim();

    if (value && !EDITORIAL_FONTS.includes(value)) {
      throw Object.assign(new Error(`La tipografía debe ser una de: ${EDITORIAL_FONTS.join(', ')}`), { status: 400 });
    }

    updates[field] = value || fallback;
  }

  if (input.editorialActive !== undefined) {
    if (typeof input.editorialActive !== 'boolean') {
      throw Object.assign(new Error('editorialActive debe ser true o false'), { status: 400 });
    }

    updates.editorialActive = input.editorialActive;
  }

  if (input.announcementActive !== undefined) {
    if (typeof input.announcementActive !== 'boolean') {
      throw Object.assign(new Error('announcementActive debe ser true o false'), { status: 400 });
    }

    updates.announcementActive = input.announcementActive;
  }

  if (input.featuredWorkIds !== undefined) {
    if (!Array.isArray(input.featuredWorkIds)) {
      throw Object.assign(new Error('featuredWorkIds debe ser una lista'), { status: 400 });
    }

    const ids = input.featuredWorkIds
      .filter((id) => typeof id === 'string' && id.trim())
      .map((id) => id.trim());

    if (ids.length > MAX_FEATURED) {
      throw Object.assign(new Error(`Puedes destacar como máximo ${MAX_FEATURED} obras`), { status: 400 });
    }

    updates.featuredWorkIds = [...new Set(ids)];
  }

  if (input.events !== undefined) {
    updates.events = parseEvents(input.events);
  }

  if (Object.keys(updates).length === 0) {
    throw Object.assign(new Error('No hay contenido que actualizar'), { status: 400 });
  }

  return writeDoc(HOME_DOC, updates, DEFAULT_HOME, updatedBy);
}

function isOwnCloudinaryUrl(url) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return Boolean(cloudName) && url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}
