import xss from 'xss';
import {
  SESSION_TYPES,
  addComment,
  createSession,
  deleteComment,
  deleteSession,
  getComment,
  getSessionById,
  incrementSessionViews,
  listComments,
  listSessions,
  toggleCommentLike as toggleLike,
  updateSession,
} from '../services/focusGroup.service.js';
import { NOTIFICATION_TYPES, createNotification } from '../services/notification.service.js';

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_COMMENT_LENGTH = 1000;
const MIN_COMMENT_LENGTH = 3;

const VALID_TYPES = Object.values(SESSION_TYPES);

/**
 * El enlace de la reunión lo abre el usuario en su navegador, así que no basta
 * con que "parezca" una URL: `javascript:` o `data:` también parsean. Solo se
 * acepta https, que es lo que sirven Meet, Zoom y Teams.
 */
function parseMeetingUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseDateTime(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDuration(value) {
  if (value === undefined || value === null || value === '') {
    return 90; // Lo que dura un encuentro típico; el admin puede cambiarlo.
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 15 && parsed <= 480 ? parsed : null;
}

function displayName(user) {
  const full = [user?.nombres, user?.apellidos].filter(Boolean).join(' ').trim();
  return full || user?.nombres || 'Anónimo';
}

// ============================================================
// Encuentros
// ============================================================

export async function getSessions(req, res) {
  try {
    // El listado del admin incluye los borradores; el público, solo publicados.
    const isAdmin = req.user?.role === 'admin';
    const includeDrafts = isAdmin && req.query.includeDrafts === 'true';

    const sessions = await listSessions({ onlyPublished: !includeDrafts });

    return res.json({ ok: true, sessions, total: sessions.length });
  } catch (error) {
    console.error('Error al listar los encuentros del grupo focal:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener los encuentros' });
  }
}

export async function getSession(req, res) {
  try {
    const session = await getSessionById(req.params.id);

    if (!session || (!session.isPublished && req.user?.role !== 'admin')) {
      return res.status(404).json({ ok: false, message: 'Encuentro no encontrado' });
    }

    const comments = await listComments(session.id);

    // Un borrador solo lo alcanza el admin al previsualizar, y eso no es una
    // visita real.
    if (session.isPublished) {
      incrementSessionViews(session.id);
    }

    return res.json({ ok: true, session, comments });
  } catch (error) {
    console.error('Error al obtener el encuentro:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener el encuentro' });
  }
}

export async function createFocusGroupSession(req, res) {
  try {
    const { type, title, description, meetingUrl, scheduledAt, duration, isPublished, allowComments } = req.body;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        ok: false,
        message: 'El tipo de encuentro debe ser cátedra (con videollamada) o tertulia (tema abierto).',
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({ ok: false, message: 'El tema es obligatorio' });
    }

    if (!description?.trim()) {
      return res.status(400).json({ ok: false, message: 'La descripción es obligatoria' });
    }

    const isSync = type === SESSION_TYPES.SYNC;
    let link = null;
    let startsAt = null;
    let durationMinutes = null;

    // Una reunión sin enlace ni hora no es una reunión: se exige aquí para que
    // nunca llegue al público una tarjeta con un botón que no lleva a ninguna
    // parte.
    if (isSync) {
      link = parseMeetingUrl(meetingUrl);
      if (!link) {
        return res.status(400).json({
          ok: false,
          message: 'El enlace de la reunión debe ser una URL https válida (Meet, Zoom, Teams…).',
        });
      }

      startsAt = parseDateTime(scheduledAt);
      if (!startsAt) {
        return res.status(400).json({ ok: false, message: 'La fecha y hora de la reunión no son válidas' });
      }

      durationMinutes = parseDuration(duration);
      if (durationMinutes === null) {
        return res.status(400).json({ ok: false, message: 'La duración debe estar entre 15 y 480 minutos' });
      }
    }

    const now = new Date().toISOString();

    const created = await createSession({
      type,
      title: xss(title.trim().slice(0, MAX_TITLE_LENGTH)),
      description: xss(description.trim().slice(0, MAX_DESCRIPTION_LENGTH)),
      meetingUrl: link,
      scheduledAt: startsAt,
      duration: durationMinutes,
      // El tema asincrónico existe para que la gente comente; cerrarle los
      // comentarios lo dejaría sin propósito.
      allowComments: isSync ? allowComments !== false : true,
      isPublished: isPublished !== false,
      views: 0,
      commentsCount: 0,
      lastCommentAt: null,
      createdBy: req.auth.uid,
      createdAt: now,
      updatedAt: now,
    });

    if (created.isPublished) {
      await notifySessionPublished(created);
    }

    return res.status(201).json({ ok: true, message: 'Encuentro creado correctamente', session: created });
  } catch (error) {
    console.error('Error al crear el encuentro:', error);
    return res.status(500).json({ ok: false, message: 'Error al crear el encuentro' });
  }
}

export async function updateFocusGroupSession(req, res) {
  try {
    const { id } = req.params;
    const existing = await getSessionById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Encuentro no encontrado' });
    }

    const { title, description, meetingUrl, scheduledAt, duration, isPublished, allowComments } = req.body;
    const updates = { updatedAt: new Date().toISOString() };

    // El tipo no se cambia después de crear: un tema con conversación abierta
    // convertido en reunión dejaría los comentarios colgando de algo que ya no
    // los admite.
    if (req.body.type !== undefined && req.body.type !== existing.type) {
      return res.status(400).json({
        ok: false,
        message: 'El tipo de encuentro no se puede cambiar. Crea uno nuevo con el otro tipo.',
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ ok: false, message: 'El tema no puede quedar vacío' });
      }
      updates.title = xss(title.trim().slice(0, MAX_TITLE_LENGTH));
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ ok: false, message: 'La descripción no puede quedar vacía' });
      }
      updates.description = xss(description.trim().slice(0, MAX_DESCRIPTION_LENGTH));
    }

    if (existing.type === SESSION_TYPES.SYNC) {
      if (meetingUrl !== undefined) {
        const link = parseMeetingUrl(meetingUrl);
        if (!link) {
          return res.status(400).json({
            ok: false,
            message: 'El enlace de la reunión debe ser una URL https válida (Meet, Zoom, Teams…).',
          });
        }
        updates.meetingUrl = link;
      }

      if (scheduledAt !== undefined) {
        const startsAt = parseDateTime(scheduledAt);
        if (!startsAt) {
          return res.status(400).json({ ok: false, message: 'La fecha y hora de la reunión no son válidas' });
        }
        updates.scheduledAt = startsAt;
      }

      if (duration !== undefined) {
        const durationMinutes = parseDuration(duration);
        if (durationMinutes === null) {
          return res.status(400).json({ ok: false, message: 'La duración debe estar entre 15 y 480 minutos' });
        }
        updates.duration = durationMinutes;
      }

      if (allowComments !== undefined) {
        updates.allowComments = Boolean(allowComments);
      }
    }

    if (isPublished !== undefined) {
      updates.isPublished = Boolean(isPublished);
    }

    const updated = await updateSession(id, updates);

    // Solo el paso de borrador a publicado avisa: notificar cada corrección de
    // título convertiría la campana en ruido.
    if (updates.isPublished === true && existing.isPublished !== true) {
      await notifySessionPublished(updated);
    }

    return res.json({ ok: true, message: 'Encuentro actualizado correctamente', session: updated });
  } catch (error) {
    console.error('Error al actualizar el encuentro:', error);
    return res.status(500).json({ ok: false, message: 'Error al actualizar el encuentro' });
  }
}

export async function deleteFocusGroupSession(req, res) {
  try {
    const { id } = req.params;
    const existing = await getSessionById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Encuentro no encontrado' });
    }

    await deleteSession(id);

    return res.json({ ok: true, message: 'Encuentro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el encuentro:', error);
    return res.status(500).json({ ok: false, message: 'Error al eliminar el encuentro' });
  }
}

// ============================================================
// Conversación
// ============================================================

export async function addSessionComment(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const session = await getSessionById(id);

    if (!session || !session.isPublished) {
      return res.status(404).json({ ok: false, message: 'Encuentro no encontrado' });
    }

    if (session.allowComments === false) {
      return res.status(403).json({ ok: false, message: 'Este encuentro no admite comentarios' });
    }

    const trimmed = (text || '').trim();

    if (trimmed.length < MIN_COMMENT_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `El comentario debe tener al menos ${MIN_COMMENT_LENGTH} caracteres`,
      });
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `El comentario no puede tener más de ${MAX_COMMENT_LENGTH} caracteres`,
      });
    }

    const comment = await addComment(id, {
      userId: req.auth.uid,
      userName: displayName(req.user),
      userPhoto: req.user?.photoURL || null,
      text: xss(trimmed),
      createdAt: new Date().toISOString(),
      likedBy: [],
      likesCount: 0,
    });

    return res.status(201).json({ ok: true, message: 'Comentario publicado', comment });
  } catch (error) {
    console.error('Error al comentar en el encuentro:', error);
    return res.status(500).json({ ok: false, message: 'Error al publicar el comentario' });
  }
}

export async function deleteSessionComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const comment = await getComment(id, commentId);

    if (!comment) {
      return res.status(404).json({ ok: false, message: 'Comentario no encontrado' });
    }

    // Solo su autor o un administrador. La comprobación va en el servidor
    // porque ocultar el botón en la interfaz no impide la petición.
    const isOwner = comment.userId === req.auth.uid;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, message: 'No puedes eliminar este comentario' });
    }

    await deleteComment(id, commentId);

    return res.json({ ok: true, message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error al eliminar el comentario:', error);
    return res.status(500).json({ ok: false, message: 'Error al eliminar el comentario' });
  }
}

export async function toggleSessionCommentLike(req, res) {
  try {
    const { id, commentId } = req.params;
    const result = await toggleLike(id, commentId, req.auth.uid);

    if (!result) {
      return res.status(404).json({ ok: false, message: 'Comentario no encontrado' });
    }

    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error al dar me gusta al comentario:', error);
    return res.status(500).json({ ok: false, message: 'Error al registrar el me gusta' });
  }
}

function notifySessionPublished(session) {
  const isSync = session.type === SESSION_TYPES.SYNC;

  return createNotification({
    type: NOTIFICATION_TYPES.FOCUS_GROUP_SESSION,
    title: isSync
      ? `Nueva cátedra del Grupo Focal: ${session.title}`
      : `Nueva tertulia del Grupo Focal: ${session.title}`,
    body: isSync
      ? 'Consulta la fecha y entra por el enlace de la videollamada.'
      : 'Entra a leer el tema y deja tu comentario.',
    link: `/grupo-focal/${session.id}`,
  });
}
