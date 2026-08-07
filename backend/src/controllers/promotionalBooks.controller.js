import { adminDb } from '../config/firebaseAdmin.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const genresData = JSON.parse(readFileSync(join(__dirname, '../config/genres.json'), 'utf-8'));

const VALID_GENRES = genresData.genres.map(g => g.value);

export async function createPromotionalBook(req, res) {
  try {
    const {
      title,
      author,
      genre,
      description,
      price,
      originalPrice,
      discount,
      isbn,
      publisher,
      publicationDate,
      pages,
      language,
      synopsis,
      coverImage,
      availability,
      tags,
    } = req.body;

    const adminId = req.auth.uid;

    if (!title?.trim() || !author?.trim() || !genre?.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'Título, autor y género son obligatorios',
      });
    }

    if (!VALID_GENRES.includes(genre.toLowerCase())) {
      return res.status(400).json({
        ok: false,
        message: `Género inválido. Válidos: ${VALID_GENRES.join(', ')}`,
      });
    }

    if (!price || price < 0) {
      return res.status(400).json({
        ok: false,
        message: 'Precio válido es obligatorio',
      });
    }

    if (originalPrice && originalPrice < price) {
      return res.status(400).json({
        ok: false,
        message: 'El precio original debe ser mayor o igual al precio actual',
      });
    }

    const calculatedDiscount = originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : (discount || 0);

    const now = new Date().toISOString();

    const book = {
      title: title.trim(),
      author: author.trim(),
      genre: genre.toLowerCase(),
      description: description?.trim() || '',
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discount: calculatedDiscount,
      isbn: isbn?.trim() || null,
      publisher: publisher?.trim() || null,
      publicationDate: publicationDate || null,
      pages: pages ? parseInt(pages) : null,
      language: language?.trim() || 'Español',
      synopsis: synopsis?.trim() || '',
      coverImage: coverImage || null,
      availability: availability || 'available',
      tags: Array.isArray(tags) ? tags.filter(t => t.trim()) : [],
      isActive: true,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
      views: 0,
      favorites: 0,
      favoritesByUsers: [],
    };

    const docRef = await adminDb.collection('promotionalBooks').add(book);

    return res.json({
      ok: true,
      message: 'Libro promocionado creado exitosamente',
      bookId: docRef.id,
      book,
    });
  } catch (error) {
    console.error('Error creating promotional book:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear libro promocionado',
      error: error.message,
    });
  }
}

export async function getPromotionalBooks(req, res) {
  try {
    const { genre } = req.query;

    let query = adminDb.collection('promotionalBooks').where('isActive', '==', true);

    if (genre && genre !== 'all') {
      query = query.where('genre', '==', genre.toLowerCase());
    }

    const snapshot = await query.get();
    let books = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Ordenar por fecha en memoria (sin necesidad de índice)
    books.sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    return res.json({
      ok: true,
      books,
      total: books.length,
    });
  } catch (error) {
    console.error('Error getting promotional books:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener libros promocionados',
      error: error.message,
    });
  }
}

export async function getPromotionalBookById(req, res) {
  try {
    const { id } = req.params;

    const doc = await adminDb.collection('promotionalBooks').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Libro no encontrado',
      });
    }

    await doc.ref.update({ views: (doc.data().views || 0) + 1 });

    return res.json({
      ok: true,
      book: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error getting promotional book:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener libro',
      error: error.message,
    });
  }
}

export async function updatePromotionalBook(req, res) {
  try {
    const { id } = req.params;
    const { title, author, genre, description, price, originalPrice, discount, isbn, publisher, publicationDate, pages, language, synopsis, coverImage, availability, tags, isActive } = req.body;

    const doc = await adminDb.collection('promotionalBooks').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Libro no encontrado',
      });
    }

    const updates = {
      updatedAt: new Date().toISOString(),
    };

    if (title) updates.title = title.trim();
    if (author) updates.author = author.trim();
    if (genre) {
      if (!VALID_GENRES.includes(genre.toLowerCase())) {
        return res.status(400).json({
          ok: false,
          message: `Género inválido`,
        });
      }
      updates.genre = genre.toLowerCase();
    }
    // Los campos opcionales se comparan contra `undefined`, no por verdadero: si
    // se compararan por verdadero, vaciar un campo desde el formulario de edición
    // no borraría nada y el valor viejo reaparecería al recargar.
    if (description !== undefined) updates.description = description?.trim() || '';
    if (price !== undefined) updates.price = parseFloat(price);
    if (originalPrice !== undefined) updates.originalPrice = originalPrice ? parseFloat(originalPrice) : null;
    if (discount !== undefined) {
      // `parseInt(null)` es NaN, y NaN es un double válido en Firestore: se
      // guardaría sin error y el precio con descuento quedaría roto.
      const parsedDiscount = parseInt(discount);
      updates.discount = Number.isNaN(parsedDiscount) ? 0 : parsedDiscount;
    }
    if (isbn !== undefined) updates.isbn = isbn?.trim() || null;
    if (publisher !== undefined) updates.publisher = publisher?.trim() || null;
    if (publicationDate !== undefined) updates.publicationDate = publicationDate || null;
    if (pages !== undefined) updates.pages = pages ? parseInt(pages) : null;
    if (language !== undefined) updates.language = language?.trim() || 'Español';
    if (synopsis !== undefined) updates.synopsis = synopsis?.trim() || '';
    if (coverImage !== undefined) updates.coverImage = coverImage || null;
    if (availability) updates.availability = availability;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.filter(t => t.trim()) : [];
    if (isActive !== undefined) updates.isActive = isActive;

    await doc.ref.update(updates);

    return res.json({
      ok: true,
      message: 'Libro actualizado exitosamente',
      book: { id: doc.id, ...doc.data(), ...updates },
    });
  } catch (error) {
    console.error('Error updating promotional book:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar libro',
      error: error.message,
    });
  }
}

export async function deletePromotionalBook(req, res) {
  try {
    const { id } = req.params;

    const doc = await adminDb.collection('promotionalBooks').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Libro no encontrado',
      });
    }

    await doc.ref.delete();

    return res.json({
      ok: true,
      message: 'Libro eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting promotional book:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al eliminar libro',
      error: error.message,
    });
  }
}

export async function toggleBookFavorite(req, res) {
  try {
    const { id } = req.params;
    const userId = req.auth?.uid || null;

    const doc = await adminDb.collection('promotionalBooks').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        message: 'Libro no encontrado',
      });
    }

    const data = doc.data();
    let favoritesByUsers = data.favoritesByUsers || [];
    let favorites = data.favorites || 0;

    if (userId) {
      if (favoritesByUsers.includes(userId)) {
        favoritesByUsers = favoritesByUsers.filter(id => id !== userId);
        favorites = Math.max(0, favorites - 1);
      } else {
        favoritesByUsers.push(userId);
        favorites += 1;
      }
    }

    await doc.ref.update({ favorites, favoritesByUsers });

    return res.json({
      ok: true,
      favorites,
      isFavorited: favoritesByUsers.includes(userId),
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar favoritos',
      error: error.message,
    });
  }
}
