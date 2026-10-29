import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebaseAdmin.js';

/**
 * Análisis de las obras de la biblioteca para el panel de administración.
 *
 * Los totales (vistas, "me gusta", comentarios, notas) ya viven dentro de cada
 * obra y se leen de ahí. Lo que NO existía era la dimensión tiempo de vistas y
 * "me gusta": solo había un contador. Para tenerla se guarda, desde ahora, un
 * documento por obra y día en `workDailyStats`:
 *
 *   id: `${obra}_${YYYY-MM-DD}`   { workId, date, views, likes }
 *
 * Es una colección aparte y no un campo del documento de la obra: un mapa
 * `dia → contador` crecería sin límite dentro de un documento que ya carga el
 * contenido completo, y se reescribiría entero en cada visita. El historial
 * empieza el día en que se activó; lo anterior no se puede reconstruir.
 */

const DAILY = 'workDailyStats';
const COMMENT_MONTHS = 12;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;
const RECENT_COMMENTS = 12;
const COMMENT_PREVIEW_LENGTH = 220;

// Colombia no tiene horario de verano, pero sí va cinco horas por detrás de UTC:
// con `toISOString()` una visita a las 8 de la noche contaría para el día
// siguiente.
const DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function dayKey(date = new Date()) {
  return DAY_FORMATTER.format(date);
}

function dailyCollection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(DAILY);
}

/**
 * Suma una vista o un "me gusta" al día de hoy. Nunca lanza: una estadística
 * no puede tumbar la lectura de una obra ni un "me gusta".
 */
export async function recordWorkEvent(workId, { views = 0, likes = 0 } = {}) {
  if (!workId || (!views && !likes)) return;

  try {
    const date = dayKey();

    await dailyCollection().doc(`${workId}_${date}`).set({
      workId,
      date,
      views: FieldValue.increment(views),
      likes: FieldValue.increment(likes),
    }, { merge: true });
  } catch (error) {
    console.error('No se pudo registrar la estadística diaria de la obra:', error.message);
  }
}

/** Al borrar una obra se van con ella sus estadísticas diarias. */
export async function purgeWorkStats(workId) {
  if (!adminDb || !workId) return;

  try {
    const snapshot = await dailyCollection().where('workId', '==', workId).get();

    for (let index = 0; index < snapshot.docs.length; index += 400) {
      const batch = adminDb.batch();
      snapshot.docs.slice(index, index + 400).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (error) {
    console.error('No se pudieron borrar las estadísticas diarias de la obra:', error.message);
  }
}

function clampDays(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 7), MAX_DAYS) : DEFAULT_DAYS;
}

// Los `days` días hasta hoy, todos presentes aunque no tengan actividad: una
// gráfica con huecos en el eje del tiempo miente sobre la distancia entre días.
function emptyDailySeries(days) {
  const series = [];
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = dayKey(new Date(today.getTime() - offset * 24 * 60 * 60 * 1000));
    series.push({ date, views: 0, likes: 0 });
  }

  return series;
}

async function loadDailySeries(days, { workIds = null, workId = null } = {}) {
  const series = emptyDailySeries(days);
  const byDate = new Map(series.map((item) => [item.date, item]));

  const query = workId
    ? dailyCollection().where('workId', '==', workId)
    : dailyCollection().where('date', '>=', series[0].date);

  const snapshot = await query.get();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const slot = byDate.get(data.date);

    if (!slot) return;
    if (workIds && !workIds.has(data.workId)) return;

    slot.views += data.views || 0;
    slot.likes += data.likes || 0;
  });

  // Desde cuándo hay historial: sin esto, una gráfica llena de ceros al
  // principio parecería "nadie lee nada" cuando en realidad aún no se medía.
  const first = await dailyCollection().orderBy('date', 'asc').limit(1).get();
  const trackingSince = first.empty ? null : first.docs[0].data().date;

  return { series, trackingSince };
}

function ratingDistribution(works) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  works.forEach((work) => {
    (work.ratings || []).forEach((rating) => {
      if (distribution[rating.score] !== undefined) distribution[rating.score] += 1;
    });
  });

  return distribution;
}

function monthlyComments(works) {
  const now = new Date();
  const buckets = [];

  for (let offset = COMMENT_MONTHS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({ year: date.getFullYear(), month: date.getMonth(), comments: 0 });
  }

  const byKey = new Map(buckets.map((bucket) => [`${bucket.year}-${bucket.month}`, bucket]));

  works.forEach((work) => {
    (work.comments || []).forEach((comment) => {
      const date = new Date(comment.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const bucket = byKey.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (bucket) bucket.comments += 1;
    });
  });

  return buckets;
}

function preview(text) {
  const value = String(text || '');
  return value.length > COMMENT_PREVIEW_LENGTH ? `${value.slice(0, COMMENT_PREVIEW_LENGTH).trim()}…` : value;
}

async function loadApprovedWorks() {
  const snapshot = await adminDb.collection('literature').where('status', '==', 'approved').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/** Panorama de todas las obras aprobadas, o de las de un autor si se indica. */
export async function getWorksAnalytics({ authorId = '', days } = {}) {
  const windowDays = clampDays(days);
  const allWorks = await loadApprovedWorks();

  // La lista de autores para el filtro sale de TODAS las obras, no de las
  // filtradas: si no, al elegir uno desaparecerían los demás del selector.
  const authorsById = new Map();
  allWorks.forEach((work) => {
    if (work.authorId && !authorsById.has(work.authorId)) {
      authorsById.set(work.authorId, work.author || 'Sin nombre');
    }
  });

  const works = authorId ? allWorks.filter((work) => work.authorId === authorId) : allWorks;
  const workIds = new Set(works.map((work) => work.id));

  const totalRatings = works.reduce((sum, work) => sum + (work.totalRatings || 0), 0);
  const weightedScore = works.reduce((sum, work) => sum + (work.averageRating || 0) * (work.totalRatings || 0), 0);

  const totals = {
    works: works.length,
    views: works.reduce((sum, work) => sum + (work.views || 0), 0),
    likes: works.reduce((sum, work) => sum + (work.likesCount || 0), 0),
    comments: works.reduce((sum, work) => sum + (work.comments || []).length, 0),
    ratings: totalRatings,
    // Media ponderada por número de notas: promediar los promedios daría el
    // mismo peso a una obra con una nota que a otra con cien.
    averageRating: totalRatings > 0 ? Math.round((weightedScore / totalRatings) * 10) / 10 : 0,
  };

  const genres = new Map();
  works.forEach((work) => {
    const key = work.genre || 'otro';
    const entry = genres.get(key) || { genre: key, works: 0, views: 0, likes: 0, comments: 0 };

    entry.works += 1;
    entry.views += work.views || 0;
    entry.likes += work.likesCount || 0;
    entry.comments += (work.comments || []).length;
    genres.set(key, entry);
  });

  const recentComments = works
    .flatMap((work) => (work.comments || []).map((comment) => ({
      workId: work.id,
      workTitle: work.title || 'Sin título',
      commentId: comment.id,
      userName: comment.userName || 'Anónimo',
      text: preview(comment.text),
      createdAt: comment.createdAt,
      likesCount: comment.likesCount || 0,
    })))
    .filter((comment) => comment.createdAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_COMMENTS);

  const { series, trackingSince } = await loadDailySeries(windowDays, { workIds });

  return {
    totals,
    works: works.map((work) => ({
      id: work.id,
      title: work.title || 'Sin título',
      author: work.author || 'Sin nombre',
      authorId: work.authorId || null,
      genre: work.genre || 'otro',
      createdAt: work.createdAt || null,
      views: work.views || 0,
      likes: work.likesCount || 0,
      comments: (work.comments || []).length,
      ratings: work.totalRatings || 0,
      averageRating: work.averageRating || 0,
    })),
    authors: [...authorsById.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    genres: [...genres.values()],
    commentsByMonth: monthlyComments(works),
    ratingDistribution: ratingDistribution(works),
    recentComments,
    daily: { days: windowDays, series, trackingSince },
  };
}

/** Detalle de una obra: sus comentarios completos, sus notas y su actividad diaria. */
export async function getWorkAnalyticsDetail(workId, { days } = {}) {
  const doc = await adminDb.collection('literature').doc(workId).get();
  if (!doc.exists) return null;

  const work = { id: doc.id, ...doc.data() };
  const windowDays = clampDays(days);
  const { series, trackingSince } = await loadDailySeries(windowDays, { workId });

  return {
    work: {
      id: work.id,
      title: work.title || 'Sin título',
      author: work.author || 'Sin nombre',
      genre: work.genre || 'otro',
      status: work.status,
      createdAt: work.createdAt || null,
      views: work.views || 0,
      likes: work.likesCount || 0,
      comments: (work.comments || []).length,
      ratings: work.totalRatings || 0,
      averageRating: work.averageRating || 0,
    },
    comments: (work.comments || [])
      .map((comment) => ({
        id: comment.id,
        userName: comment.userName || 'Anónimo',
        text: comment.text || '',
        createdAt: comment.createdAt || null,
        likesCount: comment.likesCount || 0,
      }))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    ratingDistribution: ratingDistribution([work]),
    daily: { days: windowDays, series, trackingSince },
  };
}
