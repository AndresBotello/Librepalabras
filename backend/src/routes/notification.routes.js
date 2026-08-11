import { Router } from 'express';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import {
  createAnnouncement,
  getAllNotifications,
  getMyNotifications,
  readAllNotifications,
  readOneNotification,
  removeNotification,
} from '../controllers/notification.controller.js';

const router = Router();

// La campana consulta cada minuto: todo aquí exige sesión, pero nada exige rol.
router.get('/', authenticateRequest, getMyNotifications);
router.post('/read-all', authenticateRequest, readAllNotifications);
router.post('/:id/read', authenticateRequest, readOneNotification);

// Redactar un anuncio o borrar del historial es cosa del administrador.
router.get('/admin/all', authenticateRequest, authorizeRoles(['admin']), getAllNotifications);
router.post('/admin', authenticateRequest, authorizeRoles(['admin']), createAnnouncement);
router.delete('/admin/:id', authenticateRequest, authorizeRoles(['admin']), removeNotification);

export default router;
