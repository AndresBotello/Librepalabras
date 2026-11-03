import { randomUUID } from 'node:crypto';
import xss from 'xss';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebaseAdmin.js';
import { verifyRecaptchaToken } from '../services/captcha.service.js';

/**
 * Hilo de comentarios de un documento (una columna de opinión, una obra de
 * sección...). Es la lógica que antes vivía solo en las columnas, sin cambios:
 * lo único que varía de un sitio a otro —qué documento es el padre, quién puede
 * leerlo, comentarlo o moderarlo— entra por parámetro.
 *
 * Los comentarios viven en una subcolección del padre (`{padre}/comments`) y no
 * en un array dentro del documento: uno popular puede acumular cientos y un
 * array crecería sin tope hasta chocar con el límite de 1 MiB de Firestore. El
 * padre guarda solo `commentsCount`.
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

/**
 * @param {object} options
 * @param {(req) => Promise<{ref, data}|null>} options.load  Carga el documento padre
 *   (con su referencia) o devuelve `null` si no existe o no corresponde.
 * @param {(data, req) => boolean} options.canRead   Si la petición puede ver el hilo.
 * @param {(data) => boolean} options.canWrite       Si el padre admite comentarios nuevos.
 * @param {(data, uid) => boolean} options.isOwner   Si `uid` es el dueño del padre
 *   (puede moderar los comentarios de su documento).
 * @param {string} options.notFound   Mensaje cuando el padre no existe.
 * @param {string} options.label      Nombre del padre para los registros de error.
 */
export function createCommentThread({ load, canRead, canWrite, isOwner, notFound, label }) {
  function serializeComment(doc, req, parent) {
    const data = doc.data();
    const uid = req.auth?.uid || null;
    const isAdmin = req.user?.role === 'admin';
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
      canDelete: isMine || isAdmin || (Boolean(uid) && isOwner(parent, uid)),
    };
  }

  async function list(req, res) {
    try {
      const found = await load(req);

      if (!found || !canRead(found.data, req)) {
        return res.status(404).json({ ok: false, message: notFound });
      }

      const requested = Number.parseInt(req.query.limit, 10);
      const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

      let query = found.ref.collection('comments').orderBy('createdAt', 'desc');

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
        comments: docs.map((doc) => serializeComment(doc, req, found.data)),
        total: found.data.commentsCount || 0,
        hasMore: snapshot.docs.length > limit,
      });
    } catch (error) {
      console.error(`Error al listar comentarios de ${label}:`, error);
      return res.status(500).json({ ok: false, message: 'Error al obtener los comentarios' });
    }
  }

  async function add(req, res) {
    try {
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

      const found = await load(req);

      // Solo se comenta lo publicado: si no, un borrador o una obra rechazada
      // podría acumular comentarios que nadie moderará.
      if (!found || !canWrite(found.data)) {
        return res.status(404).json({ ok: false, message: notFound });
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
      const batch = adminDb.batch();

      batch.set(found.ref.collection('comments').doc(commentId), comment);
      batch.update(found.ref, { commentsCount: FieldValue.increment(1) });
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
      console.error(`Error al comentar ${label}:`, error);
      return res.status(500).json({ ok: false, message: 'Error al publicar el comentario' });
    }
  }

  async function remove(req, res) {
    try {
      const found = await load(req);

      if (!found) {
        return res.status(404).json({ ok: false, message: notFound });
      }

      const commentRef = found.ref.collection('comments').doc(req.params.commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        return res.status(404).json({ ok: false, message: 'Comentario no encontrado' });
      }

      const isAdmin = req.user?.role === 'admin';
      const isParentOwner = isOwner(found.data, req.auth.uid);
      const isCommentOwner = commentDoc.data().userId === req.auth.uid;

      if (!isAdmin && !isParentOwner && !isCommentOwner) {
        return res.status(403).json({ ok: false, message: 'No tienes permisos para eliminar este comentario' });
      }

      const batch = adminDb.batch();
      batch.delete(commentRef);
      batch.update(found.ref, { commentsCount: FieldValue.increment(-1) });
      await batch.commit();

      return res.json({ ok: true, message: 'Comentario eliminado' });
    } catch (error) {
      console.error(`Error al eliminar el comentario de ${label}:`, error);
      return res.status(500).json({ ok: false, message: 'Error al eliminar el comentario' });
    }
  }

  return { list, add, remove };
}
