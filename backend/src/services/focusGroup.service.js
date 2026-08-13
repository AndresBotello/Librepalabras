import { adminDb } from '../config/firebaseAdmin.js';

/**
 * Grupo Focal Alfredo Correa De Andreís.
 *
 * Un "encuentro" es de uno de dos tipos. Los valores guardados son técnicos; el
 * nombre que ve el público lo pone el frontend (config/focusGroup.js):
 *   - 'sincronico'  → «Cátedra»:  reunión con fecha y enlace (Meet, Zoom…).
 *   - 'asincronico' → «Tertulia»: tema abierto que se debate en los comentarios.
 *
 * A diferencia de los comentarios de una obra —que viven en un array dentro del
 * documento—, aquí van en una subcolección. Un tema del grupo focal existe
 * *para* acumular conversación: un array tiene el techo de 1 MB del documento y,
 * peor, obliga a reescribir el documento entero en cada comentario, así que dos
 * personas comentando a la vez se pisan. La subcolección no tiene ninguno de los
 * dos problemas y se ordena con el índice de un solo campo que Firestore ya crea
 * solo.
 */

const COLLECTION = 'focusGroupSessions';
const COMMENTS = 'comments';

// Tope de conversación que se sirve de una vez. Un tema con más de 200
// comentarios necesitaría paginación, no una respuesta más grande.
const COMMENTS_LIMIT = 200;

export const SESSION_TYPES = {
  SYNC: 'sincronico',
  ASYNC: 'asincronico',
};

function sessionsCollection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(COLLECTION);
}

function toDoc(doc) {
  return { id: doc.id, ...doc.data() };
}

/**
 * Ordena en memoria (como Poliversia) para no obligar a crear un índice
 * compuesto: los encuentros de un grupo focal son decenas, no miles.
 *
 * El criterio no es el mismo para los dos tipos: una reunión se ordena por
 * cuándo ocurre y un tema por cuándo se abrió, así que se usa `scheduledAt`
 * cuando existe y `createdAt` cuando no.
 */
export async function listSessions({ onlyPublished = true } = {}) {
  const query = onlyPublished
    ? sessionsCollection().where('isPublished', '==', true)
    : sessionsCollection();

  const snapshot = await query.get();

  return snapshot.docs
    .map(toDoc)
    .sort((a, b) => {
      const left = a.scheduledAt || a.createdAt || '';
      const right = b.scheduledAt || b.createdAt || '';
      return right.localeCompare(left);
    });
}

export async function getSessionById(id) {
  const doc = await sessionsCollection().doc(id).get();
  return doc.exists ? toDoc(doc) : null;
}

export async function createSession(data) {
  const docRef = await sessionsCollection().add(data);
  return { id: docRef.id, ...data };
}

export async function updateSession(id, updates) {
  const docRef = sessionsCollection().doc(id);
  await docRef.update(updates);

  const updated = await docRef.get();
  return toDoc(updated);
}

/**
 * Borrar el encuentro tiene que llevarse la conversación con él: en Firestore
 * una subcolección sobrevive al borrado de su documento padre y quedaría
 * ocupando espacio sin que nada la enlace.
 */
export async function deleteSession(id) {
  const docRef = sessionsCollection().doc(id);
  const comments = await docRef.collection(COMMENTS).get();

  // Las escrituras por lote van de 500 en 500; con el tope de comentarios que
  // se sirve esto casi siempre es un solo lote, pero el bucle lo deja correcto
  // aunque un tema haya acumulado miles.
  for (let index = 0; index < comments.docs.length; index += 450) {
    const batch = adminDb.batch();
    comments.docs.slice(index, index + 450).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await docRef.delete();
}

/** Las visitas no deben hacer esperar a nadie ni tumbar la petición si fallan. */
export async function incrementSessionViews(id) {
  try {
    const { FieldValue } = await import('firebase-admin/firestore');
    await sessionsCollection().doc(id).update({ views: FieldValue.increment(1) });
  } catch (error) {
    console.error('No se pudo incrementar las vistas del encuentro:', error.message);
  }
}

// ============================================================
// Conversación
// ============================================================

export async function listComments(sessionId) {
  const snapshot = await sessionsCollection()
    .doc(sessionId)
    .collection(COMMENTS)
    .orderBy('createdAt', 'asc')
    .limit(COMMENTS_LIMIT)
    .get();

  return snapshot.docs.map(toDoc);
}

export async function addComment(sessionId, comment) {
  const { FieldValue } = await import('firebase-admin/firestore');
  const sessionRef = sessionsCollection().doc(sessionId);
  const commentRef = sessionRef.collection(COMMENTS).doc();

  const batch = adminDb.batch();
  batch.set(commentRef, comment);
  batch.update(sessionRef, {
    commentsCount: FieldValue.increment(1),
    lastCommentAt: comment.createdAt,
  });
  await batch.commit();

  return { id: commentRef.id, ...comment };
}

export async function getComment(sessionId, commentId) {
  const doc = await sessionsCollection()
    .doc(sessionId)
    .collection(COMMENTS)
    .doc(commentId)
    .get();

  return doc.exists ? toDoc(doc) : null;
}

export async function deleteComment(sessionId, commentId) {
  const { FieldValue } = await import('firebase-admin/firestore');
  const sessionRef = sessionsCollection().doc(sessionId);

  const batch = adminDb.batch();
  batch.delete(sessionRef.collection(COMMENTS).doc(commentId));
  batch.update(sessionRef, { commentsCount: FieldValue.increment(-1) });
  await batch.commit();
}

/**
 * En transacción porque el like lee la lista de quién dio like y la reescribe:
 * dos personas pulsando a la vez sin transacción se borran el like mutuamente.
 */
export async function toggleCommentLike(sessionId, commentId, userId) {
  const commentRef = sessionsCollection()
    .doc(sessionId)
    .collection(COMMENTS)
    .doc(commentId);

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(commentRef);

    if (!snapshot.exists) {
      return null;
    }

    const likedBy = snapshot.data().likedBy || [];
    const liked = likedBy.includes(userId);
    const next = liked ? likedBy.filter((id) => id !== userId) : [...likedBy, userId];

    transaction.update(commentRef, { likedBy: next, likesCount: next.length });

    return { liked: !liked, likesCount: next.length };
  });
}
