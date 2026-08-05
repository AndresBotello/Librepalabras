import { default as xss } from 'xss';
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
  updateStory,
  upsertRating,
} from '../services/contest.service.js';

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
    title: story.title,
    content: story.content,
    imageUrl: story.imageUrl || null,
    authorName: story.authorName,
    publishedAt: story.publishedAt || null,
    createdAt: story.createdAt,
    views: story.views || 0,
  };
}

/** Lo que ve el autor de su propio cuento: sin notas ni comentarios del jurado. */
function toAuthorStory(story) {
  return {
    ...toPublicStory(story),
    status: story.status,
    isPublished: Boolean(story.isPublished),
    updatedAt: story.updatedAt,
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

export async function getPublishedStories(_req, res) {
  try {
    const stories = await listPublishedStories();

    return res.json({
      ok: true,
      stories: stories.map(toPublicStory),
      total: stories.length,
    });
  } catch (error) {
    console.error('Error al listar cuentos publicados:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener los cuentos' });
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

    const validationError = validateStoryInput({ title, content, imageUrl });
    if (validationError) {
      return res.status(400).json({ ok: false, message: validationError });
    }

    const existing = await findStoryByAuthor(req.auth.uid);
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'Ya tienes un cuento inscrito en el concurso. Puedes editarlo mientras no esté calificado.',
      });
    }

    const now = new Date().toISOString();
    const authorName = [req.user?.nombres, req.user?.apellidos].filter(Boolean).join(' ').trim();

    const story = await createStory({
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

export async function getMyStory(req, res) {
  try {
    const story = await findStoryByAuthor(req.auth.uid);

    return res.json({
      ok: true,
      story: story ? toAuthorStory(story) : null,
    });
  } catch (error) {
    console.error('Error al obtener tu cuento:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener tu cuento' });
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

    return res.json({
      ok: true,
      message: 'Cuento actualizado',
      story: toAuthorStory(updated),
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
