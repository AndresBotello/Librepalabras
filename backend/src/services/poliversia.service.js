import { adminDb } from '../config/firebaseAdmin.js';

const COLLECTION = 'poliversiaEditions';

function editionsCollection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(COLLECTION);
}

function toEdition(doc) {
  return { id: doc.id, ...doc.data() };
}

/**
 * El orden se hace en memoria (como en promotionalBooks) para no obligar a crear
 * un índice compuesto en Firestore. El catálogo de una revista son decenas de
 * documentos, no miles.
 */
export async function listEditions({ onlyPublished = true } = {}) {
  const query = onlyPublished
    ? editionsCollection().where('isPublished', '==', true)
    : editionsCollection();

  const snapshot = await query.get();

  return snapshot.docs
    .map(toEdition)
    .sort((a, b) => (b.edition || 0) - (a.edition || 0));
}

export async function getEditionById(id) {
  const doc = await editionsCollection().doc(id).get();
  return doc.exists ? toEdition(doc) : null;
}

/** Para impedir dos ediciones con el mismo número. */
export async function findEditionByNumber(edition, { excludeId = null } = {}) {
  const snapshot = await editionsCollection().where('edition', '==', edition).get();
  const match = snapshot.docs.find((doc) => doc.id !== excludeId);

  return match ? toEdition(match) : null;
}

export async function createEdition(data) {
  const docRef = await editionsCollection().add(data);
  return { id: docRef.id, ...data };
}

export async function updateEdition(id, updates) {
  const docRef = editionsCollection().doc(id);
  await docRef.update(updates);

  const updated = await docRef.get();
  return toEdition(updated);
}

export async function deleteEdition(id) {
  await editionsCollection().doc(id).delete();
}

/** Las visitas no deben hacer esperar al lector ni tumbar la petición si fallan. */
export async function incrementEditionViews(id) {
  try {
    const { FieldValue } = await import('firebase-admin/firestore');
    await editionsCollection().doc(id).update({ views: FieldValue.increment(1) });
  } catch (error) {
    console.error('No se pudo incrementar las vistas de la edición:', error.message);
  }
}
