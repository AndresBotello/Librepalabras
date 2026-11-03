import { adminDb } from '../config/firebaseAdmin.js';
import { createCommentThread } from './commentThread.js';

/**
 * Comentarios de las columnas de opinión. La lógica del hilo (captcha para
 * visitantes, paginación, borrado) está en `commentThread.js`, compartida con
 * las obras de las secciones; aquí solo se dice qué es una columna: dónde vive,
 * cuándo se puede ver y comentar, y quién la modera.
 */

function columnRef(id) {
  return adminDb.collection('opinionColumns').doc(id);
}

const thread = createCommentThread({
  async load(req) {
    const ref = columnRef(req.params.id);
    const doc = await ref.get();

    return doc.exists ? { ref, data: { id: doc.id, ...doc.data() } } : null;
  },

  // Una columna sin publicar no admite ni muestra comentarios, salvo a su autor y
  // a los administradores (que la ven en revisión).
  canRead(column, req) {
    if (column.status === 'published') return true;
    if (req.user?.role === 'admin') return true;
    return Boolean(req.auth?.uid) && column.createdBy === req.auth.uid;
  },

  canWrite: (column) => column.status === 'published',
  isOwner: (column, uid) => column.createdBy === uid,
  notFound: 'Columna no encontrada',
  label: 'la columna',
});

export const getOpinionColumnComments = thread.list;
export const addOpinionColumnComment = thread.add;
export const deleteOpinionColumnComment = thread.remove;
