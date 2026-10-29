import { getWorkAnalyticsDetail, getWorksAnalytics } from '../services/workAnalytics.service.js';
import {
  REPORT_STATUS,
  removeCommentFromWork,
  resolveReportsForComment,
} from '../services/commentReport.service.js';

export async function getAnalyticsOverview(req, res) {
  try {
    const authorId = typeof req.query.authorId === 'string' ? req.query.authorId.trim() : '';
    const analytics = await getWorksAnalytics({ authorId, days: req.query.days });

    return res.json({ ok: true, ...analytics });
  } catch (error) {
    console.error('Error al calcular el análisis de obras:', error);
    return res.status(500).json({ ok: false, message: 'Error al calcular el análisis de obras' });
  }
}

export async function getAnalyticsWorkDetail(req, res) {
  try {
    const detail = await getWorkAnalyticsDetail(req.params.id, { days: req.query.days });

    if (!detail) {
      return res.status(404).json({ ok: false, message: 'Obra no encontrada' });
    }

    return res.json({ ok: true, ...detail });
  } catch (error) {
    console.error('Error al obtener el análisis de la obra:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener el análisis de la obra' });
  }
}

/** El administrador retira un comentario desde el detalle de la obra. */
export async function deleteAnalyticsComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const removed = await removeCommentFromWork(id, commentId);

    if (!removed) {
      return res.status(404).json({ ok: false, message: 'Comentario no encontrado' });
    }

    // Si alguien lo había reportado, esas denuncias se cierran: apuntarían a un
    // comentario que ya no existe y llenarían la cola de moderación de ruido.
    await resolveReportsForComment(commentId, REPORT_STATUS.REMOVED, req.auth?.uid);

    return res.json({ ok: true, message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error al eliminar el comentario desde el análisis:', error);
    return res.status(500).json({ ok: false, message: 'Error al eliminar el comentario' });
  }
}
