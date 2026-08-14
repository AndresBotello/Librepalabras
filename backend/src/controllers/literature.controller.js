import { adminDb } from '../config/firebaseAdmin.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { default as xss } from 'xss';
import { NOTIFICATION_TYPES, createNotification } from '../services/notification.service.js';
import { REPORT_REASONS, createReport } from '../services/commentReport.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const genresData = JSON.parse(readFileSync(join(__dirname, '../config/genres.json'), 'utf-8'));

const VALID_GENRES = genresData.genres.map(g => g.value);
const MAX_AUTHOR_LENGTH = 120;

/**
 * A quién se le atribuye la obra.
 *
 * `authorId` sigue siendo SIEMPRE quien la sube: de él dependen "mis obras",
 * el permiso de edición y el de borrar comentarios. Lo que este campo cambia es
 * la firma que se muestra, para poder publicar la obra de otra persona sin que
 * figure a nombre de quien la cargó. Si se deja vacío, se firma como antes: con
 * el nombre de la cuenta.
 */
function resolveAuthorName(input, user) {
  const typed = String(input ?? '').trim();

  if (!typed) {
    return { name: user?.name || user?.nombres || 'Anónimo', error: null };
  }

  if (typed.length < 2 || typed.length > MAX_AUTHOR_LENGTH) {
    return { name: null, error: `El nombre del autor debe tener entre 2 y ${MAX_AUTHOR_LENGTH} caracteres` };
  }

  return { name: xss(typed), error: null };
}

export async function createWork(req, res) {
  try {
    const { title, genre, content, type, price, description, tags, cover, pdfUrl } = req.body;
    const authorId = req.auth.uid;

    if (!title?.trim() || !genre?.trim() || !content?.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'Título, género y contenido son obligatorios',
      });
    }

    if (!VALID_GENRES.includes(genre.toLowerCase())) {
      return res.status(400).json({
        ok: false,
        message: `Género inválido. Válidos: ${VALID_GENRES.join(', ')}`,
      });
    }

    if (!['free', 'pdfSale'].includes(type)) {
      return res.status(400).json({
        ok: false,
        message: 'Tipo debe ser: free o pdfSale',
      });
    }

    if (type === 'pdfSale' && (!price || price < 0.99)) {
      return res.status(400).json({
        ok: false,
        message: 'Precio mínimo es $0.99',
      });
    }

    const { name: author, error: authorError } = resolveAuthorName(req.body.author, req.user);

    if (authorError) {
      return res.status(400).json({ ok: false, message: authorError });
    }

    const now = new Date().toISOString();
    const work = {
      title: title.trim(),
      genre: genre.toLowerCase(),
      content: content,
      description: description?.trim() || '',
      tags: Array.isArray(tags) ? tags.filter(t => t.trim()) : [],
      cover: cover || null,
      pdfUrl: pdfUrl || null,
      type,
      price: type === 'pdfSale' ? parseFloat(price) : null,
      status: 'pending_review',
      authorId,
      author,
      // El correo es el de quien sube la obra, no el del autor firmado: es el
      // contacto para la revisión editorial.
      authorEmail: req.user?.email || '',
      // Deja constancia de que la firma no coincide con la cuenta, para que la
      // moderación pueda distinguir una obra ajena de una suplantación.
      authoredByOther: author !== (req.user?.name || req.user?.nombres || 'Anónimo'),
      createdAt: now,
      updatedAt: now,
      views: 0,
      downloads: 0,
      ratings: [],
      comments: [],
      averageRating: 0,
      totalRatings: 0,
      totalComments: 0,
      likesCount: 0,
      likedByUsers: [],
      likedByIpHashes: [],
    };

    const docRef = await adminDb.collection('literature').add(work);

    return res.json({
      ok: true,
      message: 'Obra enviada para revisión',
      workId: docRef.id,
      work,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al crear obra',
      error: error.message,
    });
  }
}

export async function addRating(req, res) {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const userId = req.auth.uid;
    const userName = req.user?.nombres || 'Anónimo';

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        ok: false,
        message: 'La calificación debe estar entre 1 y 5',
      });
    }

    const docRef = adminDb.collection('literature').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: 'Obra no encontrada' });
    }

    const work = doc.data();
    const existingRating = work.ratings?.findIndex(r => r.userId === userId) ?? -1;

    const newRating = {
      userId,
      userName,
      score: parseInt(score),
      createdAt: new Date().toISOString(),
    };

    let ratings = work.ratings || [];
    if (existingRating !== -1) {
      ratings[existingRating] = newRating;
    } else {
      ratings.push(newRating);
    }

    const averageRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

    await docRef.update({
      ratings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
    });

    return res.json({
      ok: true,
      message: 'Calificación registrada',
      averageRating: Math.round(averageRating * 10) / 10,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al calificar',
      error: error.message,
    });
  }
}

export async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.auth.uid;
    const userName = req.user?.nombres || 'Anónimo';

    if (!text?.trim() || text.length < 3) {
      return res.status(400).json({
        ok: false,
        message: 'El comentario debe tener al menos 3 caracteres',
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        ok: false,
        message: 'El comentario no puede tener más de 1000 caracteres',
      });
    }

    const docRef = adminDb.collection('literature').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: 'Obra no encontrada' });
    }

    const sanitizedText = xss(text.trim());

    const comment = {
      id: randomUUID(),
      userId,
      userName,
      text: sanitizedText,
      createdAt: new Date().toISOString(),
      likedBy: [],
      likesCount: 0,
    };

    const comments = doc.data().comments || [];
    comments.push(comment);

    await docRef.update({
      comments,
      totalComments: comments.length,
    });

    return res.json({
      ok: true,
      message: 'Comentario agregado',
      comment,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al comentar',
      error: error.message,
    });
  }
}

export async function deleteComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const userId = req.auth.uid;

    const docRef = adminDb.collection('literature').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: 'Obra no encontrada' });
    }

    const work = doc.data();
    const comment = work.comments?.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ ok: false, message: 'Comentario no encontrado' });
    }

    if (comment.userId !== userId && work.authorId !== userId) {
      return res.status(403).json({
        ok: false,
        message: 'Solo puedes eliminar tus comentarios',
      });
    }

    const comments = work.comments.filter(c => c.id !== commentId);

    await docRef.update({
      comments,
      totalComments: comments.length,
    });

    return res.json({
      ok: true,
      message: 'Comentario eliminado',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al eliminar comentario',
      error: error.message,
    });
  }
}

export async function getApprovedWorks(req, res) {
  try {
    const { genre, limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const offsetNum = parseInt(offset) || 0;

    let query = adminDb.collection('literature').where('status', '==', 'approved');

    if (genre) {
      query = query.where('genre', '==', genre.toLowerCase());
    }

    const snapshot = await query.get();

    let allDocs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    allDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginatedDocs = allDocs.slice(offsetNum, offsetNum + limitNum);

    return res.json({
      ok: true,
      works: paginatedDocs,
      total: allDocs.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener obras',
      error: error.message,
    });
  }
}

export async function getWorkById(req, res) {
  try {
    const { id } = req.params;

    const doc = await adminDb.collection('literature').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Obra no encontrada',
      });
    }

    const work = { id: doc.id, ...doc.data() };

    if (work.status !== 'approved' && work.authorId !== req.auth?.uid) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para ver esta obra',
      });
    }

    await doc.ref.update({ views: (work.views || 0) + 1 });

    return res.json({
      ok: true,
      work,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener obra',
      error: error.message,
    });
  }
}

export async function getMyWorks(req, res) {
  try {
    const authorId = req.auth.uid;

    const snapshot = await adminDb
      .collection('literature')
      .where('authorId', '==', authorId)
      .get();

    let works = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    works.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      ok: true,
      works,
      total: works.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener tus obras',
      error: error.message,
    });
  }
}

const REVIEW_STATUSES = ['pending_review', 'approved', 'rejected'];

/**
 * Bandeja de moderación.
 *
 * Nació sirviendo solo lo pendiente —de ahí el nombre— pero el panel necesita
 * repasar también lo ya resuelto: sin eso, una obra aprobada o rechazada por
 * error desaparecía de la vista del administrador y no había manera de volver
 * sobre ella. Sin `status` sigue devolviendo lo pendiente, que es lo que espera
 * el contador del dashboard.
 *
 * El orden se calcula en memoria, como en `getApprovedWorks`, y no con un
 * `orderBy` en la consulta: combinar `where` y `orderBy` sobre campos distintos
 * obliga a crear un índice compuesto en Firestore, y sin él la consulta revienta
 * en producción.
 */
export async function getPendingWorks(req, res) {
  try {
    const { status = 'pending_review', limit = 50, offset = 0 } = req.query;

    if (!REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: `Estado inválido. Válidos: ${REVIEW_STATUSES.join(', ')}`,
      });
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const offsetNum = parseInt(offset) || 0;

    const snapshot = await adminDb
      .collection('literature')
      .where('status', '==', status)
      .get();

    const works = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Lo pendiente interesa por fecha de envío; lo ya resuelto, por fecha de
    // revisión, que es la que pone `reviewWork` en `updatedAt`. Ordenar las
    // resueltas por `createdAt` dejaba lo que se acaba de moderar enterrado
    // entre obras viejas.
    const sortField = status === 'pending_review' ? 'createdAt' : 'updatedAt';
    works.sort((a, b) => (
      new Date(b[sortField] || b.createdAt) - new Date(a[sortField] || a.createdAt)
    ));

    return res.json({
      ok: true,
      works: works.slice(offsetNum, offsetNum + limitNum),
      total: works.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener las obras',
      error: error.message,
    });
  }
}

export async function reviewWork(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        ok: false,
        message: 'Estado debe ser: approved o rejected',
      });
    }

    const docRef = adminDb.collection('literature').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Obra no encontrada',
      });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'rejected' && reason) {
      updateData.rejectionReason = reason;
    }

    await docRef.update(updateData);

    const work = doc.data();
    const updated = { id: doc.id, ...work, ...updateData };

    await notifyWorkReviewed(updated, status, reason);

    return res.json({
      ok: true,
      message: `Obra ${status === 'approved' ? 'aprobada' : 'rechazada'}`,
      work: updated,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al revisar obra',
      error: error.message,
    });
  }
}

export async function updateWork(req, res) {
  try {
    const { id } = req.params;
    const { title, genre, content, description, tags, cover, pdfUrl } = req.body;
    const authorId = req.auth.uid;

    const docRef = adminDb.collection('literature').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Obra no encontrada',
      });
    }

    const work = doc.data();

    if (work.authorId !== authorId) {
      return res.status(403).json({
        ok: false,
        message: 'Solo puedes editar tus propias obras',
      });
    }

    const updateData = {};

    if (title?.trim()) updateData.title = title.trim();
    if (genre?.trim()) {
      if (!VALID_GENRES.includes(genre.toLowerCase())) {
        return res.status(400).json({
          ok: false,
          message: `Género inválido. Válidos: ${VALID_GENRES.join(', ')}`,
        });
      }
      updateData.genre = genre.toLowerCase();
    }
    if (content?.trim()) updateData.content = content;

    // Corregir la firma sin tener que borrar y volver a subir la obra.
    if (req.body.author !== undefined) {
      const { name, error } = resolveAuthorName(req.body.author, req.user);

      if (error) {
        return res.status(400).json({ ok: false, message: error });
      }

      updateData.author = name;
      updateData.authoredByOther = name !== (req.user?.name || req.user?.nombres || 'Anónimo');
    }

    if (description !== undefined) updateData.description = description?.trim() || '';
    if (Array.isArray(tags)) updateData.tags = tags.filter(t => t.trim());
    if (cover !== undefined) updateData.cover = cover;
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;

    updateData.updatedAt = new Date().toISOString();

    await docRef.update(updateData);

    return res.json({
      ok: true,
      message: 'Obra actualizada correctamente',
      work: { id, ...work, ...updateData },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar obra',
      error: error.message,
    });
  }
}

export async function getGenres(req, res) {
  return res.json({
    ok: true,
    genres: genresData.genres,
  });
}

export async function toggleCommentLike(req, res) {
  try {
    const { id, commentId } = req.params;
    const userId = req.auth.uid;

    const docRef = adminDb.collection('literature').doc(id);

    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        throw new Error('Obra no encontrada');
      }

      const work = doc.data();
      const comments = work.comments || [];
      const commentIndex = comments.findIndex(c => c.id === commentId);

      if (commentIndex === -1) {
        throw new Error('Comentario no encontrado');
      }

      const comment = comments[commentIndex];
      let liked = false;

      if (!comment.likedBy) {
        comment.likedBy = [];
      }

      const userIndex = comment.likedBy.indexOf(userId);
      if (userIndex !== -1) {
        comment.likedBy.splice(userIndex, 1);
        comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
        liked = false;
      } else {
        comment.likedBy.push(userId);
        comment.likesCount = (comment.likesCount || 0) + 1;
        liked = true;
      }

      comments[commentIndex] = comment;
      transaction.update(docRef, { comments });

      return { liked, likesCount: comment.likesCount };
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error al dar like',
      error: error.message,
    });
  }
}

export async function toggleWorkLike(req, res) {
  try {
    const { id } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress || '';
    const ipHash = createHash('sha256').update(clientIp).digest('hex');

    let identifier = null;
    let identifierField = null;

    if (req.auth?.uid) {
      identifier = req.auth.uid;
      identifierField = 'likedByUsers';
    } else {
      identifier = ipHash;
      identifierField = 'likedByIpHashes';
    }

    const docRef = adminDb.collection('literature').doc(id);

    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        throw new Error('Obra no encontrada');
      }

      const work = doc.data();
      const likesList = work[identifierField] || [];
      let liked = false;

      const identifierIndex = likesList.indexOf(identifier);
      if (identifierIndex !== -1) {
        likesList.splice(identifierIndex, 1);
        liked = false;
      } else {
        likesList.push(identifier);
        liked = true;
      }

      transaction.update(docRef, {
        [identifierField]: likesList,
        likesCount: (work.likesCount || 0) + (liked ? 1 : -1),
      });

      return { liked, likesCount: (work.likesCount || 0) + (liked ? 1 : -1) };
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error al dar like',
      error: error.message,
    });
  }
}


/**
 * Aprobar una obra genera dos avisos distintos, y por eso no se puede resolver
 * con uno solo: al autor le importa el veredicto sobre SU obra (incluido el
 * rechazo, que nadie más debe ver) y al resto de la plataforma le importa que
 * hay algo nuevo que leer.
 *
 * `createNotification` ya absorbe sus propios errores, así que un fallo aquí no
 * revierte la revisión: la obra queda aprobada aunque el aviso no salga.
 */
async function notifyWorkReviewed(work, status, reason) {
  const workLink = `/literature?work=${work.id}`;

  if (status === 'approved') {
    await Promise.all([
      createNotification({
        type: NOTIFICATION_TYPES.WORK_APPROVED,
        title: 'Tu obra fue aprobada',
        body: `"${work.title}" ya está publicada y visible para todos.`,
        link: workLink,
        targetUid: work.authorId,
      }),
      createNotification({
        type: NOTIFICATION_TYPES.WORK_PUBLISHED,
        title: 'Nueva obra publicada',
        body: `${work.author || 'Un autor'} publicó "${work.title}".`,
        link: workLink,
      }),
    ]);

    return;
  }

  await createNotification({
    type: NOTIFICATION_TYPES.WORK_REJECTED,
    title: 'Tu obra necesita cambios',
    body: reason
      ? `"${work.title}": ${reason}`
      : `"${work.title}" no fue aprobada. Revisa las normas de publicación.`,
    link: '/collaborator/publications',
    targetUid: work.authorId,
  });
}

/**
 * Denunciar un comentario. Deliberadamente NO borra nada: solo abre un caso
 * para que un administrador decida. Si el reporte bastara para ocultar el
 * comentario, cualquier usuario podría censurar a otro reportándolo.
 */
export async function reportComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const { reason } = req.body;

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        ok: false,
        message: `El motivo debe ser uno de: ${REPORT_REASONS.join(', ')}`,
      });
    }

    const doc = await adminDb.collection('literature').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, message: 'Obra no encontrada' });
    }

    const work = doc.data();
    const comment = (work.comments || []).find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ ok: false, message: 'Comentario no encontrado' });
    }

    if (comment.userId === req.auth.uid) {
      return res.status(400).json({
        ok: false,
        message: 'No puedes reportar tu propio comentario',
      });
    }

    const { alreadyResolved } = await createReport({
      workId: id,
      workTitle: work.title,
      commentId,
      commentText: comment.text,
      commentUserId: comment.userId,
      commentUserName: comment.userName,
      reportedBy: req.auth.uid,
      reporterName: req.user?.nombres || req.user?.name || 'Anónimo',
      reason,
    });

    return res.json({
      ok: true,
      message: alreadyResolved
        ? 'Ya habías reportado este comentario y un moderador lo revisó.'
        : 'Gracias. Un moderador revisará el comentario.',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al reportar el comentario',
      error: error.message,
    });
  }
}
