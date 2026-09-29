import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import { deleteFile } from './upload.service.js';
import { cloudinaryPublicId } from '../utils/files.js';
import { computeStatus, deleteStoryWithRatings } from './contest.service.js';

/**
 * Borrado de cuenta a petición del propio usuario (derecho al olvido).
 *
 * A diferencia de `setUserDisabled` —que solo bloquea el acceso y deja todo lo
 * demás intacto—, esto recorre cada colección donde la cuenta pudo dejar
 * rastro y lo elimina de verdad. No es una operación transaccional: Firestore
 * no permite una transacción de este tamaño, así que si algo falla a mitad de
 * camino puede quedar borrado en parte. Se ejecuta en un orden pensado para
 * que un fallo a mitad de camino dañe lo menos posible (el documento de
 * `users` y la cuenta de Auth se borran siempre al final).
 */

const BATCH_CHUNK = 400;

function requireDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb;
}

async function batchDeleteRefs(refs) {
  const db = requireDb();

  for (let index = 0; index < refs.length; index += BATCH_CHUNK) {
    const batch = db.batch();
    refs.slice(index, index + BATCH_CHUNK).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function discardCloudinaryAsset(url) {
  const publicId = cloudinaryPublicId(url);
  if (!publicId) return;

  try {
    await deleteFile(publicId);
  } catch (error) {
    // Un archivo huérfano en Cloudinary no debe frenar el borrado de la cuenta.
    console.error(`No se pudo borrar ${publicId} de Cloudinary:`, error.message);
  }
}

/** Obras propias: se borran del todo, portada y PDF incluidos. */
async function purgeOwnLiteratureWorks(db, uid) {
  const snapshot = await db.collection('literature').where('authorId', '==', uid).get();

  for (const doc of snapshot.docs) {
    const work = doc.data();
    await Promise.all([discardCloudinaryAsset(work.cover), discardCloudinaryAsset(work.pdfUrl)]);
  }

  await batchDeleteRefs(snapshot.docs.map((doc) => doc.ref));

  return new Set(snapshot.docs.map((doc) => doc.id));
}

/**
 * Rastro dejado en obras ajenas: comentarios, calificaciones y "me gusta".
 * Recorre toda la colección porque Firestore no puede indexar dentro de un
 * array de objetos; en el tamaño de este catálogo es barato.
 */
async function purgeLiteratureTraces(db, uid, skipIds) {
  const snapshot = await db.collection('literature').get();

  for (const doc of snapshot.docs) {
    if (skipIds.has(doc.id)) continue;

    const work = doc.data();
    const updates = {};
    let changed = false;

    const comments = work.comments || [];
    const nextComments = comments
      .filter((comment) => comment.userId !== uid)
      .map((comment) => {
        if (!Array.isArray(comment.likedBy) || !comment.likedBy.includes(uid)) {
          return comment;
        }
        const likedBy = comment.likedBy.filter((id) => id !== uid);
        return { ...comment, likedBy, likesCount: likedBy.length };
      });

    if (nextComments.length !== comments.length || nextComments.some((c, i) => c !== comments[i])) {
      updates.comments = nextComments;
      updates.totalComments = nextComments.length;
      changed = true;
    }

    const ratings = work.ratings || [];
    const nextRatings = ratings.filter((rating) => rating.userId !== uid);
    if (nextRatings.length !== ratings.length) {
      updates.ratings = nextRatings;
      updates.totalRatings = nextRatings.length;
      updates.averageRating = nextRatings.length
        ? Math.round((nextRatings.reduce((sum, r) => sum + r.score, 0) / nextRatings.length) * 10) / 10
        : 0;
      changed = true;
    }

    const likedByUsers = work.likedByUsers || [];
    if (likedByUsers.includes(uid)) {
      updates.likedByUsers = likedByUsers.filter((id) => id !== uid);
      updates.likesCount = Math.max(0, (work.likesCount || 0) - 1);
      changed = true;
    }

    if (!changed) continue;

    updates.updatedAt = new Date().toISOString();

    try {
      await doc.ref.update(updates);
    } catch (error) {
      console.error(`No se pudo limpiar el rastro en la obra ${doc.id}:`, error.message);
    }
  }
}

/** Cuentos propios del concurso: se borran junto con sus calificaciones. */
async function purgeOwnContestStories(db, uid) {
  const snapshot = await db.collection('contestStories').where('authorId', '==', uid).get();

  for (const doc of snapshot.docs) {
    await deleteStoryWithRatings(doc.id);
  }
}

/**
 * Calificaciones puestas como jurado en cuentos ajenos: se borran y se
 * recalcula el promedio del cuento, igual que hace `upsertRating` al guardar.
 */
async function purgeJudgeRatings(db, uid) {
  const snapshot = await db.collection('contestRatings').where('judgeId', '==', uid).get();

  if (snapshot.empty) return;

  const affectedStoryIds = new Set(snapshot.docs.map((doc) => doc.data().storyId).filter(Boolean));

  await batchDeleteRefs(snapshot.docs.map((doc) => doc.ref));

  for (const storyId of affectedStoryIds) {
    const storyRef = db.collection('contestStories').doc(storyId);
    const storyDoc = await storyRef.get();
    if (!storyDoc.exists) continue;

    const remaining = await db.collection('contestRatings').where('storyId', '==', storyId).get();
    const scores = remaining.docs.map((doc) => doc.data().score);
    const totalRatings = scores.length;
    const averageScore = totalRatings
      ? Math.round((scores.reduce((sum, score) => sum + score, 0) / totalRatings) * 10) / 10
      : 0;

    const story = storyDoc.data();
    await storyRef.update({
      averageScore,
      totalRatings,
      status: computeStatus({
        isPublished: story.isPublished,
        evaluationClosed: story.evaluationClosed,
        totalRatings,
      }),
      updatedAt: new Date().toISOString(),
    });
  }
}

/** Colección heredada de historias sueltas (`POST /stories`). */
async function purgeLegacyStories(db, uid) {
  const snapshot = await db.collection('stories').where('createdBy', '==', uid).get();
  await batchDeleteRefs(snapshot.docs.map((doc) => doc.ref));
}

/** Columnas de opinión propias, con su imagen de portada si la tienen. */
async function purgeOpinionColumns(db, uid) {
  const snapshot = await db.collection('opinionColumns').where('createdBy', '==', uid).get();

  for (const doc of snapshot.docs) {
    await discardCloudinaryAsset(doc.data().coverUrl);
  }

  await batchDeleteRefs(snapshot.docs.map((doc) => doc.ref));
}

/**
 * Comentarios y asistencia del grupo focal. Viven en subcolecciones de cada
 * encuentro, así que hay que recorrerlos uno a uno.
 */
async function purgeFocusGroupTraces(db, uid) {
  const { FieldValue } = await import('firebase-admin/firestore');
  const sessions = await db.collection('focusGroupSessions').get();

  for (const session of sessions.docs) {
    const sessionRef = session.ref;

    const comments = await sessionRef.collection('comments').where('userId', '==', uid).get();
    if (!comments.empty) {
      await batchDeleteRefs(comments.docs.map((doc) => doc.ref));
      await sessionRef.update({ commentsCount: FieldValue.increment(-comments.size) }).catch(() => null);
    }

    const attendeeRef = sessionRef.collection('attendees').doc(uid);
    const attendeeDoc = await attendeeRef.get();
    if (attendeeDoc.exists) {
      await attendeeRef.delete();
      await sessionRef.update({ attendeesCount: FieldValue.increment(-1) }).catch(() => null);
    }
  }
}

/** "Me gusta" en libros promocionales: solo un id dentro de un array. */
async function purgeBookFavorites(db, uid) {
  const snapshot = await db.collection('promotionalBooks').get();

  for (const doc of snapshot.docs) {
    const favoritesByUsers = doc.data().favoritesByUsers || [];
    if (!favoritesByUsers.includes(uid)) continue;

    const favorites = doc.data().favorites || 0;
    await doc.ref.update({
      favoritesByUsers: favoritesByUsers.filter((id) => id !== uid),
      favorites: Math.max(0, favorites - 1),
    });
  }
}

/** Avisos personales dirigidos a esta cuenta (los de difusión general no le pertenecen a nadie). */
async function purgeNotifications(db, uid) {
  const snapshot = await db.collection('notifications').where('targetUid', '==', uid).get();
  await batchDeleteRefs(snapshot.docs.map((doc) => doc.ref));
}

/** Ficha del catálogo de autores: se desenlaza, no se borra (la gestiona un administrador). */
async function unlinkAuthorProfile(db, uid) {
  const snapshot = await db.collection('authors').where('userId', '==', uid).get();

  await Promise.all(
    snapshot.docs.map((doc) => doc.ref.update({ userId: null, updatedAt: new Date().toISOString() }))
  );
}

/** Denuncias de comentarios, tanto las que puso como las que recibió. */
async function purgeCommentReports(db, uid) {
  const [madeByUser, aboutUser] = await Promise.all([
    db.collection('commentReports').where('reportedBy', '==', uid).get(),
    db.collection('commentReports').where('commentUserId', '==', uid).get(),
  ]);

  const refsById = new Map();
  [...madeByUser.docs, ...aboutUser.docs].forEach((doc) => refsById.set(doc.id, doc.ref));

  await batchDeleteRefs(Array.from(refsById.values()));
}

/** Trazas en el registro de errores del servidor. */
async function purgeErrorLogs(db, uid) {
  const snapshot = await db.collection('errorLogs').where('userId', '==', uid).get();
  await batchDeleteRefs(snapshot.docs.map((doc) => doc.ref));
}

export async function deleteUserAccount(uid) {
  const db = requireDb();

  const user = await db.collection('users').doc(uid).get();
  const profile = user.exists ? user.data() : null;

  const ownWorkIds = await purgeOwnLiteratureWorks(db, uid);
  await purgeLiteratureTraces(db, uid, ownWorkIds);
  await purgeOwnContestStories(db, uid);
  await purgeJudgeRatings(db, uid);
  await purgeLegacyStories(db, uid);
  await purgeOpinionColumns(db, uid);
  await purgeFocusGroupTraces(db, uid);
  await purgeBookFavorites(db, uid);
  await purgeNotifications(db, uid);
  await unlinkAuthorProfile(db, uid);
  await purgeCommentReports(db, uid);
  await purgeErrorLogs(db, uid);

  if (profile?.photoURL) {
    await discardCloudinaryAsset(profile.photoURL);
  }

  await db.collection('users').doc(uid).delete();

  if (adminAuth) {
    try {
      await adminAuth.deleteUser(uid);
    } catch (error) {
      // El perfil de Firestore puede existir sin cuenta en Auth (o al revés);
      // no encontrarla ahí no debe impedir que el borrado se dé por completo.
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
    }
  }
}
