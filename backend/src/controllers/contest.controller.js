import { default as xss } from 'xss';
import {
  CONTEST_STATUSES,
  DEFAULT_CONTEST_ID,
  editionLabel,
  getContest,
  mergeContestStates,
  normalizeContestId,
  storyEdition,
} from '../config/contests.js';
import {
  MAX_SCORE,
  MIN_SCORE,
  computeStatus,
  createStory,
  deleteStoryWithRatings,
  findStoryByAuthor,
  getStoryById,
  listAllRatings,
  listAllStories,
  listPublishedStories,
  listRatingsForStory,
  listStoriesByAuthor,
  pickPodium,
  readContestStates,
  updateStory,
  upsertRating,
  writeContestState,
} from '../services/contest.service.js';
import { NOTIFICATION_TYPES, createNotification } from '../services/notification.service.js';

const MAX_EDITION_LENGTH = 40;
const MAX_CONTEST_NAME_LENGTH = 140;

/** El catálogo con el estado que decidió el administrador aplicado encima. */
async function loadCatalog() {
  return mergeContestStates(await readContestStates());
}

const MAX_TITLE_LENGTH = 140;
const MIN_CONTENT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 25000;
const MAX_COMMENT_LENGTH = 2000;

function isOwnCloudinaryUrl(url) {
  if (typeof url !== 'string') return false;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return Boolean(cloudName) && url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}

/**
 * Lo que ve cualquier visitante. Se construye por lista blanca a propósito: las
 * notas y los comentarios de los jueces nunca deben salir por aquí, y una lista
 * blanca no se rompe si mañana se añade un campo interno al documento.
 */
function toPublicStory(story) {
  return {
    id: story.id,
    contestId: normalizeContestId(story.contestId),
    edition: storyEdition(story),
    title: story.title,
    content: story.content,
    imageUrl: story.imageUrl || null,
    authorName: story.authorName,
    publishedAt: story.publishedAt || null,
    createdAt: story.createdAt,
    views: story.views || 0,
  };
}

/**
 * Una calificación vista por el autor. Lista blanca igual que el resto: se
 * devuelven la nota y el comentario, pero nunca el `judgeId`, para no exponer
 * el uid de una cuenta interna.
 */
function toAuthorRating(rating) {
  return {
    id: rating.id,
    judgeName: rating.judgeName,
    score: rating.score,
    comment: rating.comment || '',
    updatedAt: rating.updatedAt,
  };
}

/** Lo que ve el autor de su propio cuento, con las notas que le puso el jurado. */
function toAuthorStory(story, ratings = []) {
  return {
    ...toPublicStory(story),
    status: story.status,
    evaluationClosed: Boolean(story.evaluationClosed),
    isPublished: Boolean(story.isPublished),
    updatedAt: story.updatedAt,
    averageScore: story.averageScore || 0,
    totalRatings: story.totalRatings || 0,
    ratings: ratings.map(toAuthorRating),
  };
}

function validateStoryInput({ title, content, imageUrl }, { requireAll = true } = {}) {
  if (requireAll || title !== undefined) {
    if (!title?.trim()) return 'El título es obligatorio';
    if (title.trim().length > MAX_TITLE_LENGTH) {
      return `El título no puede superar los ${MAX_TITLE_LENGTH} caracteres`;
    }
  }

  if (requireAll || content !== undefined) {
    const length = content?.trim().length || 0;
    if (length < MIN_CONTENT_LENGTH) {
      return `El cuento debe tener al menos ${MIN_CONTENT_LENGTH} caracteres`;
    }
    if (length > MAX_CONTENT_LENGTH) {
      return `El cuento no puede superar los ${MAX_CONTENT_LENGTH} caracteres`;
    }
  }

  if (requireAll || imageUrl !== undefined) {
    if (!isOwnCloudinaryUrl(imageUrl)) {
      return 'Debes subir una imagen para tu cuento';
    }
  }

  return null;
}

// ---------------------------------------------------------------- público

export async function getPublishedStories(req, res) {
  try {
    const stories = await listPublishedStories();
    const requested = req.query.contest;

    // Sin `?contest=` se devuelve todo: la portada de Concursos los agrupa por
    // su cuenta para no pedir una lista por cada certamen.
    const visible = requested
      ? stories.filter((story) => normalizeContestId(story.contestId) === requested)
      : stories;

    return res.json({
      ok: true,
      stories: visible.map(toPublicStory),
      total: visible.length,
    });
  } catch (error) {
    console.error('Error al listar cuentos publicados:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener los cuentos' });
  }
}

/** El catálogo con el estado real de cada concurso. */
export async function getCatalog(_req, res) {
  try {
    return res.json({ ok: true, contests: await loadCatalog() });
  } catch (error) {
    console.error('Error al obtener el catálogo de concursos:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener los concursos' });
  }
}

/**
 * Ganadores de las ediciones ya cerradas. El podio se calcula solo: entre los
 * cuentos publicados de cada concurso cerrado, los de mejor promedio del
 * jurado. La nota no sale en la respuesta —sirve para ordenar, pero sigue
 * siendo información interna—; hacia afuera solo va el puesto.
 */
/** Ediciones de la más reciente a la más antigua; la vacía siempre al final. */
function compareEditions(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  return String(b).localeCompare(String(a), 'es', { numeric: true });
}

/** Agrupa cuentos por la edición sellada en cada uno. */
function groupByEdition(stories) {
  const groups = new Map();

  stories.forEach((story) => {
    const edition = storyEdition(story);
    if (!groups.has(edition)) groups.set(edition, []);
    groups.get(edition).push(story);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => compareEditions(a, b))
    .map(([edition, items]) => ({ edition, stories: items }));
}

export async function getWinners(_req, res) {
  try {
    const catalog = await loadCatalog();
    const closed = catalog.filter((contest) => contest.status === 'cerrado');

    if (closed.length === 0) {
      return res.json({ ok: true, editions: [], total: 0 });
    }

    const stories = await listPublishedStories();

    // Un podio por edición, no por concurso: al cerrar 2026 el palmarés de 2025
    // sigue siendo el de 2025, con sus propios cuentos y sus propias notas.
    const editions = closed
      .flatMap((contest) => {
        const own = stories.filter((story) => normalizeContestId(story.contestId) === contest.id);

        return groupByEdition(own).map((group) => ({
          id: `${contest.id}__${group.edition}`,
          contestId: contest.id,
          name: contest.name,
          edition: group.edition,
          winners: pickPodium(group.stories)
            .map((story, index) => ({ position: index + 1, ...toPublicStory(story) })),
        }));
      })
      .filter((edition) => edition.winners.length > 0);

    return res.json({ ok: true, editions, total: editions.length });
  } catch (error) {
    console.error('Error al obtener los ganadores:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener los ganadores' });
  }
}

export async function getPublishedStory(req, res) {
  try {
    const story = await getStoryById(req.params.id);

    if (!story || !story.isPublished) {
      return res.status(404).json({ ok: false, message: 'Cuento no encontrado' });
    }

    // Las vistas no deben hacer esperar al lector ni tumbar la petición si fallan.
    updateStory(story.id, { views: (story.views || 0) + 1 }).catch((error) => {
      console.error('No se pudo incrementar las vistas del cuento:', error.message);
    });

    return res.json({ ok: true, story: toPublicStory(story) });
  } catch (error) {
    console.error('Error al obtener el cuento:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener el cuento' });
  }
}

// ------------------------------------------------------------ colaborador

export async function submitStory(req, res) {
  try {
    const { title, content, imageUrl, imagePublicId } = req.body;

    // Sin `contestId` se asume el institucional: es lo que enviaban los
    // clientes anteriores al catálogo de concursos.
    const contestId = req.body.contestId || DEFAULT_CONTEST_ID;

    // Se consulta el estado guardado, no el del archivo: quien abre y cierra
    // las convocatorias es el administrador.
    const catalog = await loadCatalog();
    const contest = catalog.find((item) => item.id === contestId);

    if (!contest) {
      return res.status(400).json({ ok: false, message: 'El concurso indicado no existe' });
    }

    if (contest.status !== 'abierto') {
      return res.status(409).json({
        ok: false,
        message: `"${contest.name}" no está recibiendo inscripciones.`,
      });
    }

    const validationError = validateStoryInput({ title, content, imageUrl });
    if (validationError) {
      return res.status(400).json({ ok: false, message: validationError });
    }

    // La edición vigente en el momento de inscribir: se copia al documento y
    // ya no cambia aunque el administrador abra la siguiente.
    const edition = contest.edition || '';

    const existing = await findStoryByAuthor(req.auth.uid, contestId, edition);
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: `Ya tienes un cuento inscrito en "${contest.name}" ${editionLabel(edition)}. Puedes editarlo mientras no esté calificado.`,
      });
    }

    const now = new Date().toISOString();
    const authorName = [req.user?.nombres, req.user?.apellidos].filter(Boolean).join(' ').trim();

    const story = await createStory({
      contestId,
      edition,
      title: title.trim(),
      // El cuento se muestra como texto plano en el front, pero se sanea igual
      // por si algún día se renderiza como HTML.
      content: xss(content.trim()),
      imageUrl,
      imagePublicId: imagePublicId || null,
      authorId: req.auth.uid,
      authorName: authorName || 'Anónimo',
      authorEmail: req.user?.email || '',
      status: 'enviado',
      isPublished: false,
      evaluationClosed: false,
      publishedAt: null,
      publishedBy: null,
      averageScore: 0,
      totalRatings: 0,
      views: 0,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({
      ok: true,
      message: 'Tu cuento fue inscrito en el concurso',
      story: toAuthorStory(story),
    });
  } catch (error) {
    console.error('Error al inscribir el cuento:', error);
    return res.status(500).json({ ok: false, message: 'Error al inscribir el cuento' });
  }
}

/** Todas las inscripciones del autor, una por concurso. */
export async function getMyStories(req, res) {
  try {
    const stories = await listStoriesByAuthor(req.auth.uid);

    const withRatings = await Promise.all(
      stories.map(async (story) => toAuthorStory(story, await listRatingsForStory(story.id)))
    );

    return res.json({ ok: true, stories: withRatings, total: withRatings.length });
  } catch (error) {
    console.error('Error al obtener tus cuentos:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener tus cuentos' });
  }
}

export async function updateMyStory(req, res) {
  try {
    const story = await getStoryById(req.params.id);

    if (!story) {
      return res.status(404).json({ ok: false, message: 'Cuento no encontrado' });
    }

    if (story.authorId !== req.auth.uid) {
      return res.status(403).json({ ok: false, message: 'Solo puedes editar tu propio cuento' });
    }

    // Una vez el jurado cerró la evaluación o el cuento ya está publicado, el
    // texto queda congelado: si no, se estaría calificando algo distinto de lo
    // que se lee.
    if (story.evaluationClosed || story.isPublished) {
      return res.status(409).json({
        ok: false,
        message: 'Tu cuento ya fue calificado o publicado y no se puede editar.',
      });
    }

    const { title, content, imageUrl, imagePublicId } = req.body;

    const validationError = validateStoryInput({ title, content, imageUrl }, { requireAll: false });
    if (validationError) {
      return res.status(400).json({ ok: false, message: validationError });
    }

    const updates = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = xss(content.trim());
    if (imageUrl !== undefined) {
      updates.imageUrl = imageUrl;
      updates.imagePublicId = imagePublicId || null;
    }

    const updated = await updateStory(story.id, updates);
    const ratings = await listRatingsForStory(updated.id);

    return res.json({
      ok: true,
      message: 'Cuento actualizado',
      story: toAuthorStory(updated, ratings),
    });
  } catch (error) {
    console.error('Error al actualizar el cuento:', error);
    return res.status(500).json({ ok: false, message: 'Error al actualizar el cuento' });
  }
}

// ------------------------------------------------------------ admin / juez

export async function getEvaluationPanel(req, res) {
  try {
    const [stories, ratings] = await Promise.all([listAllStories(), listAllRatings()]);

    const ratingsByStory = ratings.reduce((groups, rating) => {
      (groups[rating.storyId] ||= []).push(rating);
      return groups;
    }, {});

    const judgeId = req.auth.uid;

    return res.json({
      ok: true,
      stories: stories.map((story) => {
        const storyRatings = (ratingsByStory[story.id] || [])
          .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        return {
          ...story,
          contestId: normalizeContestId(story.contestId),
          edition: storyEdition(story),
          ratings: storyRatings,
          myRating: storyRatings.find((rating) => rating.judgeId === judgeId) || null,
        };
      }),
      total: stories.length,
    });
  } catch (error) {
    console.error('Error al cargar el panel de calificación:', error);
    return res.status(500).json({ ok: false, message: 'Error al cargar el panel' });
  }
}

export async function rateStory(req, res) {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;

    const numericScore = Number(score);

    if (!Number.isFinite(numericScore) || numericScore < MIN_SCORE || numericScore > MAX_SCORE) {
      return res.status(400).json({
        ok: false,
        message: `La nota debe estar entre ${MIN_SCORE.toFixed(1)} y ${MAX_SCORE.toFixed(1)}`,
      });
    }

    // Un solo decimal: 4.5 sí, 4.55 no.
    const rounded = Math.round(numericScore * 10) / 10;
    if (rounded !== numericScore) {
      return res.status(400).json({ ok: false, message: 'La nota admite un solo decimal' });
    }

    if (comment && String(comment).length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `El comentario no puede superar los ${MAX_COMMENT_LENGTH} caracteres`,
      });
    }

    const story = await getStoryById(id);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Cuento no encontrado' });
    }

    const judgeName = [req.user?.nombres, req.user?.apellidos].filter(Boolean).join(' ').trim();

    const result = await upsertRating({
      storyId: id,
      judgeId: req.auth.uid,
      judgeName: judgeName || req.user?.email || 'Jurado',
      score: rounded,
      comment: comment ? xss(String(comment).trim()) : '',
    });

    return res.json({
      ok: true,
      message: 'Calificación guardada',
      ...result,
    });
  } catch (error) {
    console.error('Error al calificar el cuento:', error);
    return res.status(500).json({ ok: false, message: error.message || 'Error al calificar' });
  }
}

export async function getStoryRatings(req, res) {
  try {
    const story = await getStoryById(req.params.id);

    if (!story) {
      return res.status(404).json({ ok: false, message: 'Cuento no encontrado' });
    }

    const ratings = await listRatingsForStory(story.id);

    return res.json({ ok: true, story, ratings, total: ratings.length });
  } catch (error) {
    console.error('Error al obtener las calificaciones:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener las calificaciones' });
  }
}

/**
 * Publicar o despublicar. Es una decisión independiente de la nota: no se exige
 * que el cuento esté calificado para poder publicarlo.
 */
export async function setStoryPublication(req, res) {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'isPublished debe ser true o false' });
    }

    const story = await getStoryById(id);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Cuento no encontrado' });
    }

    const now = new Date().toISOString();

    const updated = await updateStory(id, {
      isPublished,
      // Al despublicar se conserva quién y cuándo lo publicó la última vez.
      publishedAt: isPublished ? now : story.publishedAt || null,
      publishedBy: isPublished ? req.auth.uid : story.publishedBy || null,
      status: computeStatus({
        isPublished,
        evaluationClosed: story.evaluationClosed,
        totalRatings: story.totalRatings || 0,
      }),
      updatedAt: now,
    });

    return res.json({
      ok: true,
      message: isPublished ? 'Cuento publicado' : 'Cuento retirado de la página pública',
      story: updated,
    });
  } catch (error) {
    console.error('Error al cambiar la publicación:', error);
    return res.status(500).json({ ok: false, message: 'Error al cambiar la publicación' });
  }
}

/** Cierra o reabre la evaluación (estado "calificado"). */
export async function setStoryEvaluation(req, res) {
  try {
    const { id } = req.params;
    const { evaluationClosed } = req.body;

    if (typeof evaluationClosed !== 'boolean') {
      return res.status(400).json({ ok: false, message: 'evaluationClosed debe ser true o false' });
    }

    const story = await getStoryById(id);
    if (!story) {
      return res.status(404).json({ ok: false, message: 'Cuento no encontrado' });
    }

    if (evaluationClosed && !(story.totalRatings > 0)) {
      return res.status(409).json({
        ok: false,
        message: 'No se puede cerrar la evaluación de un cuento que nadie ha calificado.',
      });
    }

    const updated = await updateStory(id, {
      evaluationClosed,
      status: computeStatus({
        isPublished: story.isPublished,
        evaluationClosed,
        totalRatings: story.totalRatings || 0,
      }),
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      ok: true,
      message: evaluationClosed ? 'Evaluación cerrada' : 'Evaluación reabierta',
      story: updated,
    });
  } catch (error) {
    console.error('Error al cambiar la evaluación:', error);
    return res.status(500).json({ ok: false, message: 'Error al cambiar la evaluación' });
  }
}

/**
 * Solo admin: abre, anuncia o cierra un concurso, y fija su edición. Cerrar es
 * lo que hace aparecer el podio en la página de ganadores.
 */
/**
 * Cuántos cuentos lleva cada convocatoria, desglosado por edición.
 *
 * Solo admin porque cuenta también lo que no está publicado: saber cuántos
 * inscritos hay en una convocatoria abierta es información de gestión, no de
 * la página pública.
 */
export async function getContestStats(_req, res) {
  try {
    const [catalog, stories] = await Promise.all([loadCatalog(), listAllStories()]);

    const stats = catalog.map((contest) => {
      const own = stories.filter((story) => normalizeContestId(story.contestId) === contest.id);

      return {
        contestId: contest.id,
        total: own.length,
        editions: groupByEdition(own).map((group) => ({
          edition: group.edition,
          total: group.stories.length,
          published: group.stories.filter((story) => story.isPublished).length,
          rated: group.stories.filter((story) => (story.totalRatings || 0) > 0).length,
        })),
      };
    });

    return res.json({ ok: true, stats });
  } catch (error) {
    console.error('Error al obtener las inscripciones por convocatoria:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener las inscripciones' });
  }
}

export async function setContestState(req, res) {
  try {
    const { id } = req.params;
    const { status, edition, name } = req.body;

    if (!getContest(id)) {
      return res.status(404).json({ ok: false, message: 'El concurso indicado no existe' });
    }

    if (!CONTEST_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: `El estado debe ser uno de: ${CONTEST_STATUSES.join(', ')}`,
      });
    }

    if (edition !== undefined && String(edition).length > MAX_EDITION_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `La edición no puede superar los ${MAX_EDITION_LENGTH} caracteres`,
      });
    }

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ ok: false, message: 'El nombre del concurso es obligatorio' });
    }

    if (name !== undefined && String(name).trim().length > MAX_CONTEST_NAME_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `El nombre no puede superar los ${MAX_CONTEST_NAME_LENGTH} caracteres`,
      });
    }

    const state = {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.auth.uid,
    };

    // `undefined` no se puede guardar en Firestore: si no llega edición o
    // nombre, se deja lo que hubiera.
    if (edition !== undefined) {
      state.edition = xss(String(edition).trim());
    }

    if (name !== undefined) {
      state.name = xss(String(name).trim());
    }

    // El estado anterior se lee ANTES de escribir: solo se avisa cuando la
    // convocatoria pasa a abierta, no cada vez que el admin toca la edición o
    // reguarda el mismo estado.
    const previousStatus = (await readContestStates())[id]?.status;

    const states = await writeContestState(id, state);
    const contests = mergeContestStates(states);
    const contest = contests.find((item) => item.id === id);

    if (status === 'abierto' && previousStatus !== 'abierto') {
      await createNotification({
        type: NOTIFICATION_TYPES.CONTEST_OPENED,
        title: 'Convocatoria abierta',
        body: `Ya puedes participar en ${contest?.title || 'el concurso'}${contest?.edition ? ` (${contest.edition})` : ''}.`,
        link: `/concursos/${id}`,
      });
    }

    return res.json({
      ok: true,
      message: 'Concurso actualizado',
      contests,
      contest,
    });
  } catch (error) {
    console.error('Error al actualizar el concurso:', error);
    return res.status(500).json({ ok: false, message: 'Error al actualizar el concurso' });
  }
}

/** Solo admin: retira del concurso el cuento y sus calificaciones. */
export async function deleteStory(req, res) {
  try {
    const story = await getStoryById(req.params.id);

    if (!story) {
      return res.status(404).json({ ok: false, message: 'Cuento no encontrado' });
    }

    await deleteStoryWithRatings(story.id);

    return res.json({ ok: true, message: 'Cuento eliminado del concurso' });
  } catch (error) {
    console.error('Error al eliminar el cuento:', error);
    return res.status(500).json({ ok: false, message: 'Error al eliminar el cuento' });
  }
}
