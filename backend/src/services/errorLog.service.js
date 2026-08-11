import { adminDb } from '../config/firebaseAdmin.js';

/**
 * Registro de los errores no controlados que llegan al manejador global de
 * Express. Sin esto, un 500 en producción solo existe en los logs del hosting:
 * el administrador no tiene forma de verlo desde el panel.
 *
 * Se guarda el mensaje y la traza, nunca el cuerpo de la petición: ahí viajan
 * contraseñas, tokens y datos personales.
 */

const COLLECTION = 'errorLogs';
const MAX_STACK_CHARS = 2000;

function collection() {
  return adminDb?.collection(COLLECTION) || null;
}

export async function logError(error, req) {
  const ref = collection();

  if (!ref) {
    return null;
  }

  try {
    await ref.add({
      message: String(error?.message || error).slice(0, 500),
      stack: String(error?.stack || '').slice(0, MAX_STACK_CHARS),
      status: error?.status || 500,
      method: req?.method || null,
      // `route` en vez de `originalUrl`: la query puede llevar tokens.
      route: req?.path || null,
      userId: req?.auth?.uid || null,
      userRole: req?.user?.role || null,
      createdAt: new Date().toISOString(),
    });
  } catch (writeError) {
    // Si falla el registro del error no hay nada más que hacer: escribir en la
    // consola y seguir. Lanzar aquí rompería el manejador global de Express.
    console.error('No se pudo registrar el error:', writeError.message);
  }

  return null;
}

export async function listRecentErrors(limit = 20) {
  const ref = collection();

  if (!ref) {
    return [];
  }

  const snapshot = await ref
    .orderBy('createdAt', 'desc')
    .limit(Math.min(Number(limit) || 20, 100))
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function countErrorsSince(isoDate) {
  const ref = collection();

  if (!ref) {
    return 0;
  }

  const snapshot = await ref.where('createdAt', '>=', isoDate).count().get();

  return snapshot.data().count;
}

export async function clearErrorLogs() {
  const ref = collection();

  if (!ref) {
    return 0;
  }

  // Se borra por lotes: `batch` admite 500 operaciones, así que se recorre en
  // tandas hasta vaciar la colección.
  let deleted = 0;

  for (;;) {
    const snapshot = await ref.limit(400).get();

    if (snapshot.empty) {
      break;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    deleted += snapshot.size;
  }

  return deleted;
}
