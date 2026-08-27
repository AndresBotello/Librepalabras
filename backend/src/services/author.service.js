import { adminDb } from '../config/firebaseAdmin.js';

/**
 * El catálogo de autores que se ve en /authors.
 *
 * Es una lista que arma el administrador a mano, y eso es deliberado: antes los
 * autores se deducían de quién había subido obra, así que no había forma de
 * incluir a alguien sin cuenta y cualquiera que publicara aparecía en portada
 * sin que nadie lo decidiera. Ahora publicar y figurar en el catálogo son cosas
 * distintas.
 *
 * `userId` es opcional y enlaza la ficha con una cuenta de la plataforma. Solo
 * sirve para que la ficha muestre las obras y los me gusta reales de esa
 * persona; una ficha sin enlazar es igual de válida y sale con las cifras a
 * cero.
 */

const COLLECTION = 'authors';

const MAX_NAME = 80;
// Da para una semblanza de verdad, no solo un par de líneas. Es más largo que
// el campo `descripcion` del perfil (500), del que se copia al admitir a un
// colaborador: esa copia entra corta y el administrador la amplía aquí.
const MAX_BIO = 3000;
const MAX_LINKS = 6;
const MAX_LINK_LABEL = 40;

function collection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(COLLECTION);
}

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

/**
 * Solo se aceptan imágenes subidas desde el propio panel. Mismo criterio que
 * `siteConfig.service.js`: sin esto, el formulario del administrador sería una
 * forma de incrustar contenido de terceros en la portada.
 */
function isOwnCloudinaryUrl(url) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return Boolean(cloudName) && url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}

/**
 * Enlaces de redes o página propia del autor.
 *
 * Solo http y https, y se comprueba aquí además de en el navegador: el
 * formulario del panel no es la única forma de llegar a la API, y un
 * `javascript:` guardado en la ficha se ejecutaría al pulsar el icono en la
 * página pública, que la ve cualquiera.
 *
 * La red no se guarda: se deduce del dominio al pintar. Guardarla sería un dato
 * que puede contradecir a la propia dirección.
 */
function validateLinks(input) {
  if (!Array.isArray(input)) {
    throw fail('Los enlaces deben ser una lista');
  }

  const links = [];
  const seen = new Set();

  for (const entry of input) {
    const raw = typeof entry === 'string' ? entry : entry?.url;
    const value = String(raw || '').trim();

    if (!value) continue;

    // Se admite que el administrador pegue "instagram.com/alguien" sin esquema.
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

    let url;
    try {
      url = new URL(candidate);
    } catch {
      throw fail(`"${value}" no es una dirección válida`);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw fail('Los enlaces solo pueden ser http o https');
    }

    if (!url.hostname.includes('.')) {
      throw fail(`"${value}" no es una dirección válida`);
    }

    const href = url.toString();
    if (seen.has(href)) continue;
    seen.add(href);

    const label = String((typeof entry === 'object' && entry?.label) || '').trim();
    links.push(label ? { url: href, label: label.slice(0, MAX_LINK_LABEL) } : { url: href });

    if (links.length > MAX_LINKS) {
      throw fail(`Puedes añadir como máximo ${MAX_LINKS} enlaces`);
    }
  }

  return links;
}

/**
 * Nombre, biografía y foto son obligatorios porque son exactamente los tres
 * datos que pinta la tarjeta de /authors: una ficha a la que le falte alguno se
 * ve rota, así que no se admite a medias.
 */
function validate(input = {}, { partial = false } = {}) {
  const updates = {};

  const requireField = (field) => !partial || input[field] !== undefined;

  if (requireField('name')) {
    const value = String(input.name || '').trim();

    if (value.length < 2 || value.length > MAX_NAME) {
      throw fail(`El nombre debe tener entre 2 y ${MAX_NAME} caracteres`);
    }

    updates.name = value;
  }

  if (requireField('bio')) {
    // Los saltos de línea se conservan: la biografía se escribe en párrafos y
    // la ficha la muestra tal cual. Solo se normaliza el fin de línea de
    // Windows y se recortan las tandas de líneas en blanco de más de una, que
    // al pintarse dejarían huecos enormes en la tarjeta.
    const value = String(input.bio || '')
      .replace(/\r\n?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (value.length < 10) {
      throw fail('La biografía es obligatoria: es lo que se lee en la ficha del autor');
    }

    updates.bio = value.slice(0, MAX_BIO);
  }

  if (requireField('photoURL')) {
    const value = String(input.photoURL || '').trim();

    if (!value) {
      throw fail('La foto de perfil es obligatoria');
    }

    if (!isOwnCloudinaryUrl(value)) {
      throw fail('La foto debe subirse desde el panel');
    }

    updates.photoURL = value;
  }

  // Los enlaces son opcionales: una ficha sin redes es perfectamente válida.
  if (input.links !== undefined) {
    updates.links = validateLinks(input.links);
  }

  // Se admite null explícito para desenlazar una ficha de su cuenta.
  if (input.userId !== undefined) {
    const value = input.userId === null ? null : String(input.userId).trim();
    updates.userId = value || null;
  }

  return updates;
}

/** Una cuenta no puede tener dos fichas: la de autores dejaría de ser una lista. */
async function assertUserNotTaken(userId, exceptId = null) {
  if (!userId) return;

  const snapshot = await collection().where('userId', '==', userId).get();
  const clash = snapshot.docs.find((doc) => doc.id !== exceptId);

  if (clash) {
    throw fail('Esa cuenta ya tiene ficha en el catálogo de autores', 409);
  }
}

function toAuthor(doc) {
  return { id: doc.id, ...doc.data() };
}

export async function listAuthors() {
  if (!adminDb) return [];

  // Por orden de alta en el catálogo: quien se sumó primero aparece primero,
  // no por orden alfabético del nombre.
  const snapshot = await collection().orderBy('createdAt').get();
  return snapshot.docs.map(toAuthor);
}

export async function getAuthor(id) {
  if (!adminDb) return null;

  const doc = await collection().doc(id).get();
  return doc.exists ? toAuthor(doc) : null;
}

export async function createAuthor(input = {}, createdBy = null) {
  const updates = validate(input);
  await assertUserNotTaken(updates.userId, null);

  const now = new Date().toISOString();
  const payload = {
    ...updates,
    userId: updates.userId || null,
    links: updates.links || [],
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  const ref = await collection().add(payload);
  return { id: ref.id, ...payload };
}

export async function updateAuthor(id, input = {}) {
  const existing = await getAuthor(id);

  if (!existing) {
    throw fail('Ese autor no existe', 404);
  }

  const updates = validate(input, { partial: true });

  if (Object.keys(updates).length === 0) {
    throw fail('No hay nada que actualizar');
  }

  if (updates.userId !== undefined) {
    await assertUserNotTaken(updates.userId, id);
  }

  const payload = { ...updates, updatedAt: new Date().toISOString() };
  await collection().doc(id).set(payload, { merge: true });

  return { ...existing, ...payload };
}

export async function deleteAuthor(id) {
  const existing = await getAuthor(id);

  if (!existing) {
    throw fail('Ese autor no existe', 404);
  }

  // Solo desaparece del catálogo. Ni la cuenta ni las obras se tocan: las obras
  // guardan su propio `authorId` y siguen publicadas.
  await collection().doc(id).delete();
  return existing;
}
