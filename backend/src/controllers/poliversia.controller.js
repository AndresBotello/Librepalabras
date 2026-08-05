import {
  listEditions,
  getEditionById,
  findEditionByNumber,
  createEdition,
  updateEdition,
  deleteEdition,
  incrementEditionViews,
} from '../services/poliversia.service.js';
import { deleteFile } from '../services/upload.service.js';

const MAX_TITLE_LENGTH = 140;
const MAX_DESCRIPTION_LENGTH = 800;

function parseEditionNumber(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
    return null;
  }

  return parsed;
}

function parsePublishedAt(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

/**
 * Solo aceptamos URLs que vengan de nuestra propia cuenta de Cloudinary: son las
 * únicas que pudo producir el endpoint de subida. Así una petición manipulada no
 * puede dejar apuntando la revista a un archivo externo.
 */
function isOwnCloudinaryUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return Boolean(cloudName) && url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}

// Borrar el archivo viejo es "limpieza", no parte del resultado: si Cloudinary
// falla no tiene sentido tumbar una edición que ya se guardó bien.
async function discardAsset(publicId, resourceType = 'image') {
  if (!publicId) return;

  try {
    await deleteFile(publicId, resourceType);
  } catch (error) {
    console.error(`No se pudo borrar el archivo ${publicId} de Cloudinary:`, error.message);
  }
}

export async function getEditions(req, res) {
  try {
    // El listado de admin incluye los borradores; el público, solo publicadas.
    const isAdmin = req.user?.role === 'admin';
    const includeDrafts = isAdmin && req.query.includeDrafts === 'true';

    const editions = await listEditions({ onlyPublished: !includeDrafts });

    return res.json({ ok: true, editions, total: editions.length });
  } catch (error) {
    console.error('Error al listar ediciones de Poliversia:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener las ediciones' });
  }
}

export async function getEdition(req, res) {
  try {
    const edition = await getEditionById(req.params.id);

    if (!edition) {
      return res.status(404).json({ ok: false, message: 'Edición no encontrada' });
    }

    if (!edition.isPublished && req.user?.role !== 'admin') {
      return res.status(404).json({ ok: false, message: 'Edición no encontrada' });
    }

    incrementEditionViews(edition.id);

    return res.json({ ok: true, edition });
  } catch (error) {
    console.error('Error al obtener la edición:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener la edición' });
  }
}

export async function createPoliversiaEdition(req, res) {
  try {
    const { title, description, coverUrl, coverPublicId, pdfUrl, pdfPublicId, pdfSize, pdfFileName, isPublished } = req.body;

    const edition = parseEditionNumber(req.body.edition);
    if (edition === null) {
      return res.status(400).json({ ok: false, message: 'El número de edición debe ser un entero entre 1 y 9999' });
    }

    if (!title?.trim()) {
      return res.status(400).json({ ok: false, message: 'El título es obligatorio' });
    }

    const publishedAt = parsePublishedAt(req.body.publishedAt);
    if (!publishedAt) {
      return res.status(400).json({ ok: false, message: 'La fecha de publicación no es válida' });
    }

    if (!isOwnCloudinaryUrl(pdfUrl) || !pdfPublicId) {
      return res.status(400).json({ ok: false, message: 'Debes subir el PDF de la edición antes de guardarla' });
    }

    if (coverUrl && !isOwnCloudinaryUrl(coverUrl)) {
      return res.status(400).json({ ok: false, message: 'La portada no es una imagen válida' });
    }

    const duplicated = await findEditionByNumber(edition);
    if (duplicated) {
      return res.status(409).json({ ok: false, message: `Ya existe la edición número ${edition}` });
    }

    const now = new Date().toISOString();

    const created = await createEdition({
      edition,
      title: title.trim().slice(0, MAX_TITLE_LENGTH),
      description: description?.trim().slice(0, MAX_DESCRIPTION_LENGTH) || '',
      publishedAt,
      coverUrl: coverUrl || null,
      coverPublicId: coverPublicId || null,
      pdfUrl,
      pdfPublicId,
      pdfSize: Number(pdfSize) || 0,
      pdfFileName: pdfFileName || null,
      isPublished: isPublished !== false,
      views: 0,
      createdBy: req.auth.uid,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ ok: true, message: 'Edición publicada correctamente', edition: created });
  } catch (error) {
    console.error('Error al crear la edición:', error);
    return res.status(500).json({ ok: false, message: 'Error al crear la edición' });
  }
}

export async function updatePoliversiaEdition(req, res) {
  try {
    const { id } = req.params;
    const existing = await getEditionById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Edición no encontrada' });
    }

    const { title, description, coverUrl, coverPublicId, pdfUrl, pdfPublicId, pdfSize, pdfFileName, isPublished } = req.body;
    const updates = { updatedAt: new Date().toISOString() };

    if (req.body.edition !== undefined) {
      const edition = parseEditionNumber(req.body.edition);
      if (edition === null) {
        return res.status(400).json({ ok: false, message: 'El número de edición debe ser un entero entre 1 y 9999' });
      }

      const duplicated = await findEditionByNumber(edition, { excludeId: id });
      if (duplicated) {
        return res.status(409).json({ ok: false, message: `Ya existe la edición número ${edition}` });
      }

      updates.edition = edition;
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ ok: false, message: 'El título no puede quedar vacío' });
      }
      updates.title = title.trim().slice(0, MAX_TITLE_LENGTH);
    }

    if (description !== undefined) {
      updates.description = description?.trim().slice(0, MAX_DESCRIPTION_LENGTH) || '';
    }

    if (req.body.publishedAt !== undefined) {
      const publishedAt = parsePublishedAt(req.body.publishedAt);
      if (!publishedAt) {
        return res.status(400).json({ ok: false, message: 'La fecha de publicación no es válida' });
      }
      updates.publishedAt = publishedAt;
    }

    if (isPublished !== undefined) {
      updates.isPublished = Boolean(isPublished);
    }

    // Reemplazo de PDF: se cambian solo los campos del archivo, el resto de la
    // metadata (número, título, fecha, vistas, autoría) se conserva intacta.
    let pdfToDiscard = null;
    if (pdfUrl !== undefined) {
      if (!isOwnCloudinaryUrl(pdfUrl) || !pdfPublicId) {
        return res.status(400).json({ ok: false, message: 'El PDF de reemplazo no es válido' });
      }

      if (pdfPublicId !== existing.pdfPublicId) {
        pdfToDiscard = existing.pdfPublicId;
      }

      updates.pdfUrl = pdfUrl;
      updates.pdfPublicId = pdfPublicId;
      updates.pdfSize = Number(pdfSize) || 0;
      updates.pdfFileName = pdfFileName || null;
    }

    let coverToDiscard = null;
    if (coverUrl !== undefined) {
      if (coverUrl && !isOwnCloudinaryUrl(coverUrl)) {
        return res.status(400).json({ ok: false, message: 'La portada no es una imagen válida' });
      }

      if (coverPublicId !== existing.coverPublicId) {
        coverToDiscard = existing.coverPublicId;
      }

      updates.coverUrl = coverUrl || null;
      updates.coverPublicId = coverPublicId || null;
    }

    const updated = await updateEdition(id, updates);

    await Promise.all([discardAsset(pdfToDiscard), discardAsset(coverToDiscard)]);

    return res.json({ ok: true, message: 'Edición actualizada correctamente', edition: updated });
  } catch (error) {
    console.error('Error al actualizar la edición:', error);
    return res.status(500).json({ ok: false, message: 'Error al actualizar la edición' });
  }
}

export async function deletePoliversiaEdition(req, res) {
  try {
    const { id } = req.params;
    const existing = await getEditionById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Edición no encontrada' });
    }

    await deleteEdition(id);
    await Promise.all([discardAsset(existing.pdfPublicId), discardAsset(existing.coverPublicId)]);

    return res.json({ ok: true, message: 'Edición eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la edición:', error);
    return res.status(500).json({ ok: false, message: 'Error al eliminar la edición' });
  }
}
