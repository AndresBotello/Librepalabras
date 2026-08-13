import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { commentRateLimiter, likeRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  addSessionComment,
  createFocusGroupSession,
  deleteFocusGroupSession,
  deleteSessionComment,
  getSession,
  getSessions,
  toggleSessionCommentLike,
  updateFocusGroupSession,
} from '../controllers/focusGroup.controller.js';

const router = Router();

// Públicas: `attachUserIfPresent` deja que un admin logueado vea también los
// borradores sin bloquear al visitante anónimo.
router.get('/', attachUserIfPresent, getSessions);
router.get('/:id', attachUserIfPresent, getSession);

// Conversación: hace falta sesión, sea cual sea el rol.
router.post('/:id/comments', authenticateRequest, commentRateLimiter, addSessionComment);
router.delete('/:id/comments/:commentId', authenticateRequest, deleteSessionComment);
router.post('/:id/comments/:commentId/like', authenticateRequest, likeRateLimiter, toggleSessionCommentLike);

// Crear y gestionar encuentros: solo administradores.
router.post('/', authenticateRequest, authorizeRoles(['admin']), createFocusGroupSession);
router.patch('/:id', authenticateRequest, authorizeRoles(['admin']), updateFocusGroupSession);
router.delete('/:id', authenticateRequest, authorizeRoles(['admin']), deleteFocusGroupSession);

export default router;
