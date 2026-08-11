import {
  NOTIFICATION_TYPES,
  createNotification,
  deleteNotification,
  listAllNotifications,
  listNotificationsForUser,
  markAllAsRead,
  markOneAsRead,
} from '../services/notification.service.js';
import { invalidateUserCache } from '../middlewares/auth.middleware.js';

export async function getMyNotifications(req, res) {
  try {
    // `req.user` ya viene del middleware de sesión, así que el estado de lectura
    // sale de ahí en vez de releer el perfil desde Firestore.
    const { notifications, unreadCount } = await listNotificationsForUser(
      req.auth.uid,
      req.user
    );

    return res.json({
      ok: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener las notificaciones',
      error: error.message,
    });
  }
}

export async function readAllNotifications(req, res) {
  try {
    const readAt = await markAllAsRead(req.auth.uid);

    // El estado de lectura vive en el perfil, y el perfil se cachea 30 s por
    // sesión. Sin invalidarlo, la siguiente consulta de la campana leería la
    // copia anterior y las notificaciones volverían a aparecer como no leídas.
    invalidateUserCache(req.auth.uid);

    return res.json({
      ok: true,
      message: 'Notificaciones marcadas como leídas',
      readAt,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al marcar las notificaciones',
      error: error.message,
    });
  }
}

export async function readOneNotification(req, res) {
  try {
    const { id } = req.params;
    await markOneAsRead(req.auth.uid, id);

    // Misma razón que en readAllNotifications: el id leído se guarda en el
    // perfil, así que la copia cacheada queda obsoleta.
    invalidateUserCache(req.auth.uid);

    return res.json({
      ok: true,
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al marcar la notificación',
      error: error.message,
    });
  }
}

/** Anuncio manual del administrador a toda la plataforma. */
export async function createAnnouncement(req, res) {
  try {
    const { title, body, link } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El anuncio necesita un título',
      });
    }

    const notification = await createNotification({
      type: NOTIFICATION_TYPES.ANNOUNCEMENT,
      title,
      body,
      link,
      createdBy: req.auth.uid,
    });

    if (!notification) {
      return res.status(500).json({
        ok: false,
        message: 'No se pudo crear el anuncio',
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'Anuncio publicado',
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al crear el anuncio',
      error: error.message,
    });
  }
}

export async function getAllNotifications(req, res) {
  try {
    const notifications = await listAllNotifications(Number(req.query.limit) || 60);

    return res.json({
      ok: true,
      notifications,
      total: notifications.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener el historial de notificaciones',
      error: error.message,
    });
  }
}

export async function removeNotification(req, res) {
  try {
    const { id } = req.params;
    await deleteNotification(id);

    return res.json({
      ok: true,
      message: 'Notificación eliminada',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al eliminar la notificación',
      error: error.message,
    });
  }
}
