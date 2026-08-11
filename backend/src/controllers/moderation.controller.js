import {
  REPORT_STATUS,
  countPendingReports,
  getReport,
  listReports,
  removeCommentFromWork,
  resolveReport,
  resolveReportsForComment,
} from '../services/commentReport.service.js';

export async function getCommentReports(req, res) {
  try {
    const { status = 'pending', limit = 50 } = req.query;

    const [reports, pendingCount] = await Promise.all([
      listReports({ status, limit }),
      countPendingReports(),
    ]);

    return res.json({
      ok: true,
      reports,
      total: reports.length,
      pendingCount,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener los comentarios reportados',
      error: error.message,
    });
  }
}

export async function getCommentReportsCount(_req, res) {
  try {
    const pendingCount = await countPendingReports();

    return res.json({ ok: true, pendingCount });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al contar los reportes',
      error: error.message,
    });
  }
}

/**
 * Dos desenlaces: descartar la denuncia (el comentario se queda) o eliminar el
 * comentario. En el segundo caso se borra primero de la obra y solo después se
 * cierran las denuncias, para que un fallo a mitad no deje la cola diciendo que
 * el comentario se eliminó cuando sigue publicado.
 */
export async function resolveCommentReport(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['dismiss', 'remove'].includes(action)) {
      return res.status(400).json({
        ok: false,
        message: 'La acción debe ser: dismiss o remove',
      });
    }

    const report = await getReport(id);

    if (!report) {
      return res.status(404).json({
        ok: false,
        message: 'Reporte no encontrado',
      });
    }

    if (report.status !== REPORT_STATUS.PENDING) {
      return res.status(409).json({
        ok: false,
        message: 'Este reporte ya fue resuelto',
      });
    }

    if (action === 'dismiss') {
      const updated = await resolveReport(id, REPORT_STATUS.DISMISSED, req.auth?.uid);

      return res.json({
        ok: true,
        message: 'Reporte descartado. El comentario permanece publicado.',
        report: updated,
      });
    }

    const removed = await removeCommentFromWork(report.workId, report.commentId);

    // Que el comentario ya no esté no es un error: alguien pudo borrarlo antes.
    // El reporte se cierra igual para sacarlo de la cola.
    const closed = await resolveReportsForComment(
      report.commentId,
      REPORT_STATUS.REMOVED,
      req.auth?.uid
    );

    return res.json({
      ok: true,
      message: removed
        ? `Comentario eliminado. Se cerraron ${closed} reporte(s).`
        : 'El comentario ya no existía. El reporte se cerró igualmente.',
      commentRemoved: removed,
      resolvedReports: closed,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al resolver el reporte',
      error: error.message,
    });
  }
}
