import { adminDb } from '../config/firebaseAdmin.js';
import { queryOrderedWithFallback } from '../utils/firestoreQuery.js';

/**
 * Modelo de difusión, no de bandeja de entrada.
 *
 * Una notificación de "nueva obra publicada" le interesa a todos los usuarios.
 * Escribir un documento por usuario (fan-out) multiplicaría cada aviso por el
 * tamaño del padrón: con 500 cuentas, publicar una obra costaría 500 escrituras.
 * En su lugar se guarda UN documento con `audience: 'all'` y el estado de
 * lectura vive en el perfil de quien lee.
 *
 * Los avisos personales ("tu obra fue aprobada") sí llevan destinatario y usan
 * `audience: 'user'` con `targetUid`.
 */

const COLLECTION = 'notifications';

// Los avisos viejos no se muestran: sin este tope la consulta crecería sin
// límite y la campana acabaría trayendo el historial completo del sitio.
const FEED_LIMIT = 30;

// El array de leídos individualmente se poda a este tamaño. Más allá, el
// `readAt` global ya cubre todo lo anterior.
const MAX_READ_IDS = 120;

export const NOTIFICATION_TYPES = {
  WORK_PUBLISHED: 'work_published',
  WORK_APPROVED: 'work_approved',
  WORK_REJECTED: 'work_rejected',
  MAGAZINE_PUBLISHED: 'magazine_published',
  CONTEST_OPENED: 'contest_opened',
  ROLE_CHANGED: 'role_changed',
  ANNOUNCEMENT: 'announcement',
};

const VALID_TYPES = Object.values(NOTIFICATION_TYPES);

function collection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(COLLECTION);
}

function usersCollection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection('users');
}

/**
 * Crea una notificación. `targetUid` la convierte en personal; sin él es para
 * todo el mundo.
 *
 * Nunca lanza: un aviso es un efecto secundario del acto que lo origina, y
 * publicar una obra no debe fallar porque la notificación no se pudo escribir.
 * El error se registra y la operación principal sigue su curso.
 */
export async function createNotification({
  type,
  title,
  body = '',
  link = null,
  targetUid = null,
  createdBy = null,
}) {
  try {
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`Tipo de notificación inválido: ${type}`);
    }

    if (!title?.trim()) {
      throw new Error('La notificación necesita un título');
    }

    const notification = {
      type,
      title: title.trim().slice(0, 160),
      body: (body || '').trim().slice(0, 400),
      link: link || null,
      audience: targetUid ? 'user' : 'all',
      targetUid: targetUid || null,
      createdBy: createdBy || null,
      createdAt: new Date().toISOString(),
    };

    const docRef = await collection().add(notification);

    return { id: docRef.id, ...notification };
  } catch (error) {
    console.error('No se pudo crear la notificación:', error.message);
    return null;
  }
}

/**
 * El feed de un usuario: los avisos generales más los dirigidos a él.
 *
 * Firestore no sabe hacer un OR entre `audience == 'all'` y
 * `targetUid == uid` en una sola consulta con orden, así que se lanzan las dos
 * en paralelo y se mezclan aquí. Cada una está acotada a FEED_LIMIT, de modo
 * que el coste no depende del volumen histórico.
 */
export async function listNotificationsForUser(uid, userProfile = null) {
  if (!adminDb) {
    return { notifications: [], unreadCount: 0 };
  }

  const [broadcastSnap, personalSnap] = await Promise.all([
    queryOrderedWithFallback(collection().where('audience', '==', 'all'), {
      orderField: 'createdAt',
      limit: FEED_LIMIT,
    }),
    uid
      ? queryOrderedWithFallback(collection().where('targetUid', '==', uid), {
          orderField: 'createdAt',
          limit: FEED_LIMIT,
        })
      : Promise.resolve({ docs: [] }),
  ]);

  const readState = await resolveReadState(uid, userProfile);

  const merged = [...broadcastSnap.docs, ...personalSnap.docs]
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, FEED_LIMIT)
    .map((item) => ({
      ...item,
      read: isRead(item, readState),
    }));

  return {
    notifications: merged,
    unreadCount: merged.filter((item) => !item.read).length,
  };
}

async function resolveReadState(uid, userProfile) {
  if (!uid) {
    return { readAt: null, readIds: new Set() };
  }

  const profile = userProfile || (await usersCollection().doc(uid).get()).data() || {};

  return {
    readAt: profile.notificationsReadAt || null,
    readIds: new Set(profile.notificationsReadIds || []),
  };
}

function isRead(notification, { readAt, readIds }) {
  if (readIds.has(notification.id)) {
    return true;
  }

  // "Marcar todas como leídas" guarda un instante, no una lista: cualquier
  // aviso anterior a ese instante cuenta como leído sin escribir su id.
  return Boolean(readAt) && notification.createdAt <= readAt;
}

export async function markAllAsRead(uid) {
  if (!adminDb || !uid) {
    return null;
  }

  const now = new Date().toISOString();

  // El array de ids individuales queda obsoleto: todo lo anterior a `now` ya
  // está cubierto por la marca temporal.
  await usersCollection().doc(uid).set(
    {
      notificationsReadAt: now,
      notificationsReadIds: [],
      updatedAt: now,
    },
    { merge: true }
  );

  return now;
}

export async function markOneAsRead(uid, notificationId) {
  if (!adminDb || !uid || !notificationId) {
    return null;
  }

  const docRef = usersCollection().doc(uid);

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);
    const current = snapshot.data() || {};
    const readIds = current.notificationsReadIds || [];

    if (readIds.includes(notificationId)) {
      return;
    }

    // Se conservan los más recientes: los que caen fuera del recorte son
    // antiguos y la campana ya no los lista.
    const next = [notificationId, ...readIds].slice(0, MAX_READ_IDS);

    transaction.set(
      docRef,
      {
        notificationsReadIds: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  return notificationId;
}

export async function deleteNotification(id) {
  if (!adminDb || !id) {
    return false;
  }

  await collection().doc(id).delete();
  return true;
}

/** Vista de administración: todo, sin filtrar por destinatario. */
export async function listAllNotifications(limit = 60) {
  if (!adminDb) {
    return [];
  }

  const snapshot = await collection()
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit, 200))
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
