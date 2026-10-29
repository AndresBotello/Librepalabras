import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { publicCommentRateLimiter, likeRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  addSessionComment,
  createFocusGroupSession,
  deleteFocusGroupSession,
  deleteSessionComment,
  getSession,
  getSessionAttendees,
  getSessions,
  toggleSessionAttendance,
  toggleSessionCommentLike,
  updateFocusGroupSession,
} from '../controllers/focusGroup.controller.js';

const router = Router();

// Públicas: `attachUserIfPresent` deja que un admin logueado vea también los
// borradores sin bloquear al visitante anónimo.
router.get('/', attachUserIfPresent, getSessions);
router.get('/:id', attachUserIfPresent, getSession);

// Conversación: comentar está abierto a visitantes sin cuenta (con nombre,
// captcha y límite por IP); borrar y reaccionar exigen sesión.
// `attachUserIfPresent` va antes del limitador porque este exime a los admins.
router.post('/:id/comments', attachUserIfPresent, publicCommentRateLimiter, addSessionComment);
router.delete('/:id/comments/:commentId', authenticateRequest, deleteSessionComment);
router.post('/:id/comments/:commentId/like', authenticateRequest, likeRateLimiter, toggleSessionCommentLike);

// Confirmar asistencia a una cátedra: hace falta sesión, sea cual sea el rol.
router.post('/:id/rsvp', authenticateRequest, likeRateLimiter, toggleSessionAttendance);

// Crear y gestionar encuentros: solo administradores.
router.post('/', authenticateRequest, authorizeRoles(['admin']), createFocusGroupSession);
router.patch('/:id', authenticateRequest, authorizeRoles(['admin']), updateFocusGroupSession);
router.delete('/:id', authenticateRequest, authorizeRoles(['admin']), deleteFocusGroupSession);
router.get('/:id/attendees', authenticateRequest, authorizeRoles(['admin']), getSessionAttendees);

export default router;
