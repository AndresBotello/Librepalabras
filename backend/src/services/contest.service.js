import { adminDb } from '../config/firebaseAdmin.js';
import { normalizeContestId, storyEdition } from '../config/contests.js';

const STORIES = 'contestStories';
const RATINGS = 'contestRatings';

// Un único documento con el estado de todos los concursos: son cuatro campos,
// no merece una colección propia.
const SETTINGS = 'appSettings';
const CONTESTS_DOC = 'contests';

export const CONTEST_STATUSES = ['enviado', 'en_evaluacion', 'calificado', 'publicado'];

// Nota escolar colombiana: 0.0 a 5.0 con un decimal.
export const MIN_SCORE = 0;
export const MAX_SCORE = 5;

function storiesCollection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(STORIES);
}

function ratingsCollection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(RATINGS);
}

function contestsSettingsRef() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(SETTINGS).doc(CONTESTS_DOC);
}

/**
 * Estado de los concursos tal como lo dejó el administrador, indexado por id.
 * Si nunca se ha tocado nada, el documento no existe y manda el catálogo.
 */
export async function readContestStates() {
  const doc = await contestsSettingsRef().get();
  return doc.exists ? doc.data() || {} : {};
}

export async function writeContestState(contestId, state) {
  // `set` con merge crea el documento la primera vez sin pisar los otros concursos.
  await contestsSettingsRef().set({ [contestId]: state }, { merge: true });
  return readContestStates();
}

/**
 * Un juez solo puede tener una calificación por cuento, así que el id del
 * documento es determinista: guardar dos veces actualiza en vez de duplicar.
 */
function ratingId(storyId, judgeId) {
  return `${storyId}__${judgeId}`;
}

/**
 * `status` es un campo derivado que se guarda desnormalizado para poder filtrar
 * y mostrarlo sin recalcular. Las fuentes de verdad son `isPublished`,
 * `evaluationClosed` y el número de calificaciones.
 *
 * Publicar es independiente de calificar: un cuento puede publicarse sin tener
 * ninguna nota, y al despublicarlo vuelve al estado que le corresponda.
 */
export function computeStatus({ isPublished, evaluationClosed, totalRatings }) {
  if (isPublished) return 'publicado';
  if (evaluationClosed) return 'calificado';
  if (totalRatings > 0) return 'en_evaluacion';
  return 'enviado';
}

function toDoc(doc) {
  return { id: doc.id, ...doc.data() };
}

export async function createStory(data) {
  const docRef = await storiesCollection().add(data);
  return { id: docRef.id, ...data };
}

export async function getStoryById(id) {
  const doc = await storiesCollection().doc(id).get();
  return doc.exists ? toDoc(doc) : null;
}

/**
 * Todo lo que ha inscrito un autor, en cualquier concurso. Se filtra en memoria
 * por `contestId` (en vez de con un segundo `where`) porque los cuentos
 * anteriores al catálogo de concursos no tienen ese campo.
 */
export async function listStoriesByAuthor(authorId) {
  const snapshot = await storiesCollection().where('authorId', '==', authorId).get();

  return snapshot.docs
    .map(toDoc)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

/**
 * Un colaborador solo puede concursar con un cuento en cada edición.
 *
 * El límite es por edición y no por concurso: quien participó en 2025 vuelve a
 * presentarse en 2026, que es justo lo que hace que un certamen sea anual.
 */
export async function findStoryByAuthor(authorId, contestId, edition) {
  const stories = await listStoriesByAuthor(authorId);

  return stories.find((story) => (
    normalizeContestId(story.contestId) === contestId && storyEdition(story) === edition
  )) || null;
}

export async function updateStory(id, updates) {
  const docRef = storiesCollection().doc(id);
  await docRef.update(updates);

  const updated = await docRef.get();
  return toDoc(updated);
}

/**
 * Orden en memoria (igual que el resto del proyecto) para no depender de un
 * índice compuesto de Firestore.
 */
export async function listPublishedStories() {
  const snapshot = await storiesCollection().where('isPublished', '==', true).get();

  return snapshot.docs
    .map(toDoc)
    .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0));
}

/** Cuántos puestos tiene el podio de cada edición cerrada. */
export const PODIUM_SIZE = 3;

/**
 * El podio de un concurso: entre sus cuentos publicados, los de mejor promedio
 * del jurado, de mayor a menor.
 *
 * La regla vive aquí, y no en el controlador, porque hay dos sitios que
 * preguntan quién ganó —la página de Ganadores y el buscador del sitio— y no
 * pueden contestar cosas distintas según quién pregunte.
 *
 * Un cuento sin ninguna nota queda fuera: publicar y calificar son decisiones
 * independientes, y sin nota no hay con qué compararlo.
 */
export function pickPodium(stories = []) {
  return stories
    .filter((story) => (story.totalRatings || 0) > 0)
    .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
    .slice(0, PODIUM_SIZE);
}

export async function listAllStories() {
  const snapshot = await storiesCollection().get();

  return snapshot.docs
    .map(toDoc)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function listRatingsForStory(storyId) {
  const snapshot = await ratingsCollection().where('storyId', '==', storyId).get();

  return snapshot.docs
    .map(toDoc)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

export async function listAllRatings() {
  const snapshot = await ratingsCollection().get();
  return snapshot.docs.map(toDoc);
}

export async function getRatingByJudge(storyId, judgeId) {
  const doc = await ratingsCollection().doc(ratingId(storyId, judgeId)).get();
  return doc.exists ? toDoc(doc) : null;
}

/**
 * Guarda la calificación y recalcula el promedio del cuento en una transacción,
 * para que dos jueces calificando a la vez no se pisen el agregado.
 */
export async function upsertRating({ storyId, judgeId, judgeName, score, comment }) {
  const storyRef = storiesCollection().doc(storyId);
  const ratingRef = ratingsCollection().doc(ratingId(storyId, judgeId));
  const now = new Date().toISOString();

  return adminDb.runTransaction(async (transaction) => {
    const [storyDoc, existingRating] = await Promise.all([
      transaction.get(storyRef),
      transaction.get(ratingRef),
    ]);

    if (!storyDoc.exists) {
      throw new Error('Cuento no encontrado');
    }

    // Las lecturas de una transacción deben ir todas antes de las escrituras.
    const siblings = await transaction.get(ratingsCollection().where('storyId', '==', storyId));

    const scores = siblings.docs
      .filter((doc) => doc.id !== ratingRef.id)
      .map((doc) => doc.data().score);

    scores.push(score);

    const totalRatings = scores.length;
    const averageScore = Math.round((scores.reduce((sum, value) => sum + value, 0) / totalRatings) * 10) / 10;

    const rating = {
      storyId,
      judgeId,
      judgeName,
      score,
      comment,
      createdAt: existingRating.exists ? existingRating.data().createdAt : now,
      updatedAt: now,
    };

    transaction.set(ratingRef, rating);

    const story = storyDoc.data();
    transaction.update(storyRef, {
      averageScore,
      totalRatings,
      status: computeStatus({
        isPublished: story.isPublished,
        evaluationClosed: story.evaluationClosed,
        totalRatings,
      }),
      updatedAt: now,
    });

    return { rating: { id: ratingRef.id, ...rating }, averageScore, totalRatings };
  });
}

/** Al borrar un cuento hay que llevarse sus calificaciones. */
export async function deleteStoryWithRatings(storyId) {
  const ratings = await ratingsCollection().where('storyId', '==', storyId).get();

  const batch = adminDb.batch();
  ratings.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(storiesCollection().doc(storyId));

  await batch.commit();
}
