import { getSystemHealth } from '../services/health.service.js';
import { clearErrorLogs } from '../services/errorLog.service.js';
import { deleteFile } from '../services/upload.service.js';

export async function getHealthReport(_req, res) {
  try {
    const health = await getSystemHealth();

    return res.json({ ok: true, health });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el estado del sistema',
      error: error.message,
    });
  }
}

export async function deleteErrorLogs(_req, res) {
  try {
    const deleted = await clearErrorLogs();

    return res.json({
      ok: true,
      message: `Se borraron ${deleted} registro(s) de error`,
      deleted,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al limpiar el registro',
      error: error.message,
    });
  }
}

/**
 * Borrado de archivos huérfanos, uno a uno y siempre por petición explícita del
 * administrador. Nada de limpieza automática: un falso positivo aquí destruye
 * la portada o el PDF de una obra publicada.
 */
export async function deleteOrphanFile(req, res) {
  try {
    const { publicId, resourceType = 'image' } = req.body;

    if (!publicId || typeof publicId !== 'string') {
      return res.status(400).json({
        ok: false,
        message: 'publicId es obligatorio',
      });
    }

    if (!['image', 'raw', 'video'].includes(resourceType)) {
      return res.status(400).json({
        ok: false,
        message: 'resourceType debe ser: image, raw o video',
      });
    }

    // El prefijo es la única garantía de que no se borra algo de otra carpeta
    // si la petición llega manipulada.
    if (!publicId.startsWith('librepalaras/')) {
      return res.status(400).json({
        ok: false,
        message: 'Solo se pueden borrar archivos de la carpeta de la plataforma',
      });
    }

    await deleteFile(publicId, resourceType);

    return res.json({
      ok: true,
      message: 'Archivo eliminado de Cloudinary',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al eliminar el archivo',
      error: error.message,
    });
  }
}
