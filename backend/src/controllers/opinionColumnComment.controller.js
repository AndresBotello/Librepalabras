import { randomUUID } from 'node:crypto';
import xss from 'xss';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebaseAdmin.js';
import { verifyRecaptchaToken } from '../services/captcha.service.js';

/**
 * Comentarios de las columnas de opinión.
 *
 * Viven en una subcolección de cada columna (`opinionColumns/{id}/comments`) y
 * no en un array dentro del documento: una columna popular puede acumular
 * cientos y un array crecería sin tope hasta chocar con el límite de 1 MiB de
 * Firestore. La columna guarda solo `commentsCount`.
 *
 * Pueden comentar tanto usuarios con sesión como visitantes. A los visitantes
 * se les exige captcha (además del límite de frecuencia de la ruta) y se les
 * marca con `isGuest` para que nadie pueda hacerse pasar por un usuario real o
 * por el equipo editorial escribiendo un nombre cualquiera.
 */

const MIN_TEXT_LENGTH = 3;
const MAX_TEXT_LENGTH = 1000;
const MAX_NAME_LENGTH = 40;
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

function columnRef(id) {
  return adminDb.collection('opinionColumns').doc(id);
}

// Los comentarios se pintan como texto plano en React, que ya escapa el HTML;
// aun así se quitan etiquetas y caracteres de control para que lo guardado no
// dependa de quién lo muestre. Lo que `xss` escapa de más (`<` suelto) se
// devuelve a su forma normal: es texto, no marcado.
function cleanPlainText(value, maxLength) {
  if (typeof value !== 'string') return '';

  const stripped = xss(value, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return stripped.slice(0, maxLength).trim();
}

function displayNameOf(user) {
  const full = [user?.nombres, user?.apellidos].filter(Boolean).join(' ').trim();
  return cleanPlainText(full || user?.name || '', MAX_NAME_LENGTH) || 'Usuario';
}

function serializeComment(doc, req, column) {
  const data = doc.data();
  const uid = req.auth?.uid || null;
  const isAdmin = req.user?.role === 'admin';
  const isColumnOwner = Boolean(uid) && column.createdBy === uid;
  const isMine = Boolean(uid) && data.userId === uid;

  return {
    id: doc.id,
    authorName: data.authorName,
    text: data.text,
    createdAt: data.createdAt,
    isGuest: Boolean(data.isGuest),
    mine: isMine,
    // El `userId` no sale del servidor: lo único que la interfaz necesita saber
    // es si ella puede borrarlo.
    canDelete: isMine || isColumnOwner || isAdmin,
  };
}

async function loadColumn(id) {
  const doc = await columnRef(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// Una columna sin publicar no admite ni muestra comentarios, salvo a su autor y
// a los administradores (que la ven en revisión).
function canAccessColumn(column, req) {
  if (column.status === 'published') return true;
  if (req.user?.role === 'admin') return true;
  return Boolean(req.auth?.uid) && column.createdBy === req.auth.uid;
}

export async function getOpinionColumnComments(req, res) {
  try {
    const { id } = req.params;
    const column = await loadColumn(id);

    if (!column || !canAccessColumn(column, req)) {
      return res.status(404).json({ ok: false, message: 'Columna no encontrada' });
    }

    const requested = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

    let query = columnRef(id).collection('comments').orderBy('createdAt', 'desc');

    // Paginación por cursor: la fecha del último comentario ya mostrado.
    // ISO 8601 ordena igual como texto que como fecha.
    if (typeof req.query.before === 'string' && req.query.before) {
      query = query.startAfter(req.query.before);
    }

    // Se pide uno de más solo para saber si queda otra página.
    const snapshot = await query.limit(limit + 1).get();
    const docs = snapshot.docs.slice(0, limit);

    return res.json({
      ok: true,
      comments: docs.map((doc) => serializeComment(doc, req, column)),
      total: column.commentsCount || 0,
      hasMore: snapshot.docs.length > limit,
    });
  } catch (error) {
    console.error('Error al listar comentarios de la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener los comentarios' });
  }
}

export async function addOpinionColumnComment(req, res) {
  try {
    const { id } = req.params;
    const { text, name, captchaToken, website } = req.body || {};

    // Campo trampa: está oculto para las personas, así que solo lo rellenan los
    // bots. Se responde como si hubiera funcionado para no darles pistas.
    if (website) {
      return res.status(201).json({ ok: true, message: 'Comentario publicado' });
    }

    const cleanText = cleanPlainText(text, MAX_TEXT_LENGTH);

    if (cleanText.length < MIN_TEXT_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `El comentario debe tener al menos ${MIN_TEXT_LENGTH} caracteres`,
      });
    }

    if (typeof text === 'string' && text.trim().length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        ok: false,
        message: `El comentario no puede tener más de ${MAX_TEXT_LENGTH} caracteres`,
      });
    }

    const column = await loadColumn(id);

    // Solo se comenta una columna publicada: si no, un borrador o una columna
    // rechazada podría acumular comentarios que nadie moderará.
    if (!column || column.status !== 'published') {
      return res.status(404).json({ ok: false, message: 'Columna no encontrada' });
    }

    const isGuest = !req.auth;
    let authorName;

    if (isGuest) {
      const captcha = await verifyRecaptchaToken(captchaToken);

      if (!captcha.ok) {
        return res.status(captcha.status).json({ ok: false, message: captcha.message });
      }

      authorName = cleanPlainText(name, MAX_NAME_LENGTH) || 'Visitante';
    } else {
      authorName = displayNameOf(req.user);
    }

    const comment = {
      authorName,
      text: cleanText,
      userId: req.auth?.uid || null,
      isGuest,
      createdAt: new Date().toISOString(),
    };

    const commentId = randomUUID();
    const ref = columnRef(id);
    const batch = adminDb.batch();

    batch.set(ref.collection('comments').doc(commentId), comment);
    batch.update(ref, { commentsCount: FieldValue.increment(1) });
    await batch.commit();

    return res.status(201).json({
      ok: true,
      message: 'Comentario publicado',
      comment: {
        id: commentId,
        authorName: comment.authorName,
        text: comment.text,
        createdAt: comment.createdAt,
        isGuest,
        mine: !isGuest,
        canDelete: !isGuest,
      },
    });
  } catch (error) {
    console.error('Error al comentar la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al publicar el comentario' });
  }
}

export async function deleteOpinionColumnComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const column = await loadColumn(id);

    if (!column) {
      return res.status(404).json({ ok: false, message: 'Columna no encontrada' });
    }

    const commentRef = columnRef(id).collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({ ok: false, message: 'Comentario no encontrado' });
    }

    const isAdmin = req.user?.role === 'admin';
    const isColumnOwner = column.createdBy === req.auth.uid;
    const isCommentOwner = commentDoc.data().userId === req.auth.uid;

    if (!isAdmin && !isColumnOwner && !isCommentOwner) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para eliminar este comentario' });
    }

    const batch = adminDb.batch();
    batch.delete(commentRef);
    batch.update(columnRef(id), { commentsCount: FieldValue.increment(-1) });
    await batch.commit();

    return res.json({ ok: true, message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error al eliminar el comentario de la columna:', error);
    return res.status(500).json({ ok: false, message: 'Error al eliminar el comentario' });
  }
}
