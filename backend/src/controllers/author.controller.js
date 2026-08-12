import { adminDb } from '../config/firebaseAdmin.js';
import {
  createAuthor,
  deleteAuthor,
  getAuthor,
  listAuthors,
  updateAuthor,
} from '../services/author.service.js';

/**
 * Las cifras de cada ficha se calculan al vuelo a partir de las obras
 * aprobadas, igual que hacía el listado derivado que había antes. No se
 * guardan en la ficha a propósito: se quedarían viejas en cuanto alguien
 * publique, comente o le den un me gusta.
 *
 * Una sola lectura de la colección para todas las fichas; hacer una consulta
 * por autor multiplicaría el coste de la portada.
 */
async function statsByUserId(userIds = []) {
  const stats = {};

  if (!adminDb || userIds.length === 0) {
    return stats;
  }

  const snapshot = await adminDb.collection('literature').where('status', '==', 'approved').get();

  snapshot.docs.forEach((doc) => {
    const work = doc.data();

    if (!userIds.includes(work.authorId)) return;

    const entry = stats[work.authorId] || { publications: 0, totalLikes: 0, genres: [] };
    entry.publications += 1;
    entry.totalLikes += work.likesCount || 0;
    if (work.genre) entry.genres.push(work.genre);
    stats[work.authorId] = entry;
  });

  return stats;
}

/**
 * La ficha se sirve con la misma forma que consumían las pantallas de autores y
 * portada, para no tener que rehacerlas: si no hay cuenta enlazada, las cifras
 * van a cero, que es lo correcto para alguien que no publica aquí.
 */
function present(author, stats = {}) {
  const own = (author.userId && stats[author.userId]) || null;

  return {
    id: author.id,
    name: author.name,
    description: author.bio,
    photoURL: author.photoURL || null,
    userId: author.userId || null,
    links: author.links || [],
    publications: own?.publications || 0,
    totalLikes: own?.totalLikes || 0,
    tags: own ? [...new Set(own.genres)].slice(0, 3) : [],
    role: 'Autor',
    createdAt: author.createdAt || null,
    updatedAt: author.updatedAt || null,
  };
}

export async function getAuthors(_req, res) {
  try {
    const authors = await listAuthors();
    const stats = await statsByUserId(authors.map((a) => a.userId).filter(Boolean));

    const presented = authors
      .map((author) => present(author, stats))
      .sort((a, b) => b.publications - a.publications || a.name.localeCompare(b.name));

    return res.json({ ok: true, authors: presented, total: presented.length });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el catálogo de autores',
      error: error.message,
    });
  }
}

export async function getAuthorById(req, res) {
  try {
    const author = await getAuthor(req.params.id);

    if (!author) {
      return res.status(404).json({ ok: false, message: 'Ese autor no existe' });
    }

    const stats = await statsByUserId(author.userId ? [author.userId] : []);
    return res.json({ ok: true, author: present(author, stats) });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el autor',
      error: error.message,
    });
  }
}

export async function postAuthor(req, res) {
  try {
    const author = await createAuthor(req.body, req.auth?.uid);
    return res.status(201).json({
      ok: true,
      message: 'Autor añadido al catálogo',
      author: present(author),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.status ? error.message : 'Error al crear el autor',
    });
  }
}

export async function patchAuthor(req, res) {
  try {
    const author = await updateAuthor(req.params.id, req.body);
    const stats = await statsByUserId(author.userId ? [author.userId] : []);

    return res.json({
      ok: true,
      message: 'Autor actualizado',
      author: present(author, stats),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.status ? error.message : 'Error al actualizar el autor',
    });
  }
}

export async function removeAuthor(req, res) {
  try {
    await deleteAuthor(req.params.id);
    return res.json({ ok: true, message: 'Autor retirado del catálogo' });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.status ? error.message : 'Error al retirar el autor',
    });
  }
}
