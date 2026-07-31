import { adminDb } from '../config/firebaseAdmin.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { default as xss } from 'xss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const genresData = JSON.parse(readFileSync(join(__dirname, '../config/genres.json'), 'utf-8'));

const VALID_GENRES = genresData.genres.map(g => g.value);

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
      author: req.user?.name || req.user?.nombres || 'Anónimo',
      authorEmail: req.user?.email || '',
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
    const { genre } = req.query;
    const snapshot = await adminDb.collection('literature').where('status', '==', 'approved').get();

    let works = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (genre) {
      works = works.filter(w => w.genre === genre.toLowerCase());
    }

    // Enriquecer con información del usuario
    works = await Promise.all(works.map(async (work) => {
      try {
        const userDoc = await adminDb.collection('users').doc(work.authorId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          return {
            ...work,
            authorPhotoURL: userData.photoURL || null,
            authorDescription: userData.descripcion || null,
          };
        }
      } catch (err) {
        console.error(`Error fetching user ${work.authorId}:`, err);
      }
      return work;
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

export async function getPendingWorks(req, res) {
  try {
    const snapshot = await adminDb
      .collection('literature')
      .where('status', '==', 'pending_review')
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
      message: 'Error al obtener obras pendientes',
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

    const updated = { id: doc.id, ...doc.data(), ...updateData };

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

export async function getAllAuthors(req, res) {
  try {
    // Obtener todos los usuarios
    const usersSnapshot = await adminDb.collection('users').get();

    // Obtener todas las obras aprobadas
    const worksSnapshot = await adminDb.collection('literature').where('status', '==', 'approved').get();
    const works = worksSnapshot.docs.map(doc => doc.data());

    // Construir mapa de autores con estadísticas
    const authorsMap = {};

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Filtrar obras de este autor
      const authorWorks = works.filter(w => w.authorId === userId);

      if (authorWorks.length > 0) {
        // Calcular estadísticas
        const totalLikes = authorWorks.reduce((sum, work) => sum + (work.likesCount || 0), 0);
        const primaryGenre = authorWorks[0]?.genre || 'Autor';
        const genreInfo = genresData.genres.find(g => g.value === primaryGenre);

        authorsMap[userId] = {
          id: userId,
          name: `${userData.nombres || ''} ${userData.apellidos || ''}`.trim() || 'Anónimo',
          email: userData.email,
          description: userData.descripcion || null,
          photoURL: userData.photoURL || null,
          role: genreInfo?.label || 'Autor',
          category: primaryGenre,
          publications: authorWorks.length,
          totalLikes: totalLikes,
          tags: [...new Set(authorWorks.map(w => w.genre))].slice(0, 3),
        };
      }
    }

    // Convertir a array y ordenar por publicaciones
    const authors = Object.values(authorsMap)
      .sort((a, b) => b.publications - a.publications);

    return res.json({
      ok: true,
      authors,
      total: authors.length,
    });
  } catch (error) {
    console.error('Error al obtener autores:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener autores',
      error: error.message,
    });
  }
}
