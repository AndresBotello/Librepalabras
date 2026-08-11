import { adminDb } from '../config/firebaseAdmin.js';
import { queryOrderedWithFallback } from '../utils/firestoreQuery.js';

/**
 * Los comentarios viven dentro del documento de la obra, en un array. Un
 * reporte, en cambio, es una colección aparte: el admin necesita listar "todo
 * lo reportado" sin recorrer las obras una por una, y el reporte debe seguir
 * existiendo aunque el comentario se elimine (para dejar constancia de qué se
 * moderó y quién lo hizo).
 *
 * Por eso el reporte guarda una copia del texto denunciado: si el comentario
 * desaparece, el admin todavía puede ver qué estaba juzgando.
 */

const COLLECTION = 'commentReports';

export const REPORT_REASONS = ['spam', 'ofensivo', 'acoso', 'desinformacion', 'otro'];

export const REPORT_STATUS = {
  PENDING: 'pending',
  DISMISSED: 'dismissed',
  REMOVED: 'removed',
};

function collection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(COLLECTION);
}

/**
 * Un mismo usuario no puede denunciar dos veces el mismo comentario: el id del
 * documento se compone de ambos, así que un segundo intento sobrescribe el
 * primero en vez de inflar la cola de moderación.
 */
function reportId(commentId, reporterId) {
  return `${commentId}__${reporterId}`;
}

export async function createReport({
  workId,
  workTitle,
  commentId,
  commentText,
  commentUserId,
  commentUserName,
  reportedBy,
  reporterName,
  reason,
}) {
  const docRef = collection().doc(reportId(commentId, reportedBy));
  const existing = await docRef.get();

  if (existing.exists && existing.data().status !== REPORT_STATUS.PENDING) {
    // Ya se moderó una denuncia de esta persona sobre este comentario: reabrirla
    // devolvería a la cola algo que el admin ya decidió.
    return { report: { id: docRef.id, ...existing.data() }, alreadyResolved: true };
  }

  const report = {
    workId,
    workTitle: workTitle || 'Sin título',
    commentId,
    commentText: commentText || '',
    commentUserId: commentUserId || '',
    commentUserName: commentUserName || 'Anónimo',
    reportedBy,
    reporterName: reporterName || 'Anónimo',
    reason,
    status: REPORT_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  };

  await docRef.set(report);

  return { report: { id: docRef.id, ...report }, alreadyResolved: false };
}

export async function listReports({ status = 'pending', limit = 50 } = {}) {
  if (!adminDb) {
    return [];
  }

  let query = collection();

  if (status && status !== 'all') {
    query = query.where('status', '==', status);
  }

  const snapshot = await queryOrderedWithFallback(query, {
    orderField: 'createdAt',
    limit: Math.min(Number(limit) || 50, 200),
  });

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function countPendingReports() {
  if (!adminDb) {
    return 0;
  }

  // `count()` se resuelve en el servidor de Firestore: devuelve el número sin
  // descargar los documentos, así que el badge del panel es casi gratis.
  const snapshot = await collection()
    .where('status', '==', REPORT_STATUS.PENDING)
    .count()
    .get();

  return snapshot.data().count;
}

export async function getReport(id) {
  if (!adminDb) {
    return null;
  }

  const snapshot = await collection().doc(id).get();

  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function resolveReport(id, status, resolvedBy) {
  await collection().doc(id).update({
    status,
    resolvedBy: resolvedBy || null,
    resolvedAt: new Date().toISOString(),
  });

  return getReport(id);
}

/**
 * Al eliminar un comentario se cierran TODAS sus denuncias, no solo la que el
 * admin tenía abierta: si tres personas reportaron lo mismo, resolver una y
 * dejar dos huérfanas apuntando a un comentario que ya no existe convertiría la
 * cola en ruido.
 */
export async function resolveReportsForComment(commentId, status, resolvedBy) {
  if (!adminDb) {
    return 0;
  }

  const snapshot = await collection()
    .where('commentId', '==', commentId)
    .where('status', '==', REPORT_STATUS.PENDING)
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = adminDb.batch();
  const now = new Date().toISOString();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status,
      resolvedBy: resolvedBy || null,
      resolvedAt: now,
    });
  });

  await batch.commit();

  return snapshot.size;
}

/** Quita el comentario del array de la obra. Devuelve false si ya no estaba. */
export async function removeCommentFromWork(workId, commentId) {
  if (!adminDb) {
    return false;
  }

  const docRef = adminDb.collection('literature').doc(workId);

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);

    if (!snapshot.exists) {
      return false;
    }

    const comments = snapshot.data().comments || [];
    const next = comments.filter((comment) => comment.id !== commentId);

    if (next.length === comments.length) {
      return false;
    }

    transaction.update(docRef, {
      comments: next,
      totalComments: next.length,
      updatedAt: new Date().toISOString(),
    });

    return true;
  });
}
