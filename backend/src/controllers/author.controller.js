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
 *
 * Una obra llega a una ficha por dos caminos: porque se la asociaron a mano
 * (`authorProfileId`) o porque la subió la cuenta enlazada a esa ficha. El
 * primero manda y cada obra suma en una sola: sin esa desambiguación, la obra
 * que un autor sube y además asocia a su propia ficha contaría dos veces.
 */
async function statsByAuthor(authors = []) {
  const stats = {};

  if (!adminDb || authors.length === 0) {
    return stats;
  }

  const profileIds = new Set(authors.map((author) => author.id));
  const byUserId = new Map(
    authors.filter((author) => author.userId).map((author) => [author.userId, author.id])
  );

  const snapshot = await adminDb.collection('literature').where('status', '==', 'approved').get();

  snapshot.docs.forEach((doc) => {
    const work = doc.data();
    const profileId = profileIds.has(work.authorProfileId)
      ? work.authorProfileId
      : byUserId.get(work.authorId);

    if (!profileId) return;

    const entry = stats[profileId] || { publications: 0, totalLikes: 0, genres: [] };
    entry.publications += 1;
    entry.totalLikes += work.likesCount || 0;
    if (work.genre) entry.genres.push(work.genre);
    stats[profileId] = entry;
  });

  return stats;
}

/**
 * La ficha se sirve con la misma forma que consumían las pantallas de autores y
 * portada, para no tener que rehacerlas: si no hay cuenta enlazada, las cifras
 * van a cero, que es lo correcto para alguien que no publica aquí.
 *
 * `userId` (el UID de Firebase Auth vinculado a la ficha) solo va en la
 * respuesta cuando quien pregunta es admin: es el panel de autores el que lo
 * necesita, para no enlazar la misma cuenta dos veces. El catálogo público no
 * tiene por qué exponer ese dato.
 */
function present(author, stats = {}, { includeUserId = true } = {}) {
  const own = stats[author.id] || null;

  return {
    id: author.id,
    name: author.name,
    description: author.bio,
    photoURL: author.photoURL || null,
    ...(includeUserId ? { userId: author.userId || null } : {}),
    links: author.links || [],
    publications: own?.publications || 0,
    totalLikes: own?.totalLikes || 0,
    tags: own ? [...new Set(own.genres)].slice(0, 3) : [],
    role: 'Autor',
    createdAt: author.createdAt || null,
    updatedAt: author.updatedAt || null,
  };
}

export async function getAuthors(req, res) {
  try {
    const includeUserId = req.user?.role === 'admin';
    const authors = await listAuthors();
    const stats = await statsByAuthor(authors);

    const presented = authors
      .map((author) => present(author, stats, { includeUserId }))
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

    const includeUserId = req.user?.role === 'admin';
    const stats = await statsByAuthor([author]);
    return res.json({ ok: true, author: present(author, stats, { includeUserId }) });
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
    const stats = await statsByAuthor([author]);

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
