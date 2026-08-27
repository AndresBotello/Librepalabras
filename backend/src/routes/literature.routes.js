import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles, AUTHOR_ROLES } from '../middlewares/role.middleware.js';
import { commentRateLimiter, likeRateLimiter, reportRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  createWork,
  getApprovedWorks,
  getWorkById,
  getMyWorks,
  getPendingWorks,
  reviewWork,
  getGenres,
  getScopes,
  addRating,
  addComment,
  deleteComment,
  updateWork,
  deleteWork,
  toggleCommentLike,
  toggleWorkLike,
  reportComment,
} from '../controllers/literature.controller.js';

const router = Router();

// Rutas públicas - PRIMERO las más específicas
router.get('/genres', getGenres);
router.get('/scopes', getScopes);
router.get('/approved', getApprovedWorks);
// Los autores ya no se deducen de aquí: son un catálogo propio en /api/authors.

// Autoría: crear y gestionar obra propia. Antes solo pedían sesión iniciada,
// así que cualquier usuario autenticado podía publicar; ahora está explícito.
router.post('/', authenticateRequest, authorizeRoles(AUTHOR_ROLES), createWork);
router.get('/user/my-works', authenticateRequest, authorizeRoles(AUTHOR_ROLES), getMyWorks);

// Rutas solo para admins
router.get('/admin/pending', authenticateRequest, authorizeRoles(['admin']), getPendingWorks);
// Mismo manejador, nombre honesto: con ?status= sirve también lo aprobado y lo
// rechazado. La ruta anterior se mantiene porque el dashboard sigue llamándola.
router.get('/admin/works', authenticateRequest, authorizeRoles(['admin']), getPendingWorks);
router.patch('/:id/review', authenticateRequest, authorizeRoles(['admin']), reviewWork);

// Rutas con parámetro /:id - AL FINAL
router.patch('/:id', authenticateRequest, authorizeRoles(AUTHOR_ROLES), updateWork);
// Borrar la obra propia. Misma puerta que editarla —el control de que es tuya
// lo hace el manejador con `authorId`—, porque quien puede reescribirla entera
// tiene ya, de hecho, la potestad de retirarla.
router.delete('/:id', authenticateRequest, authorizeRoles(AUTHOR_ROLES), deleteWork);
router.post('/:id/rate', authenticateRequest, addRating);
router.post('/:id/comment', authenticateRequest, commentRateLimiter, addComment);
router.delete('/:id/comment/:commentId', authenticateRequest, deleteComment);
router.post('/:id/comment/:commentId/like', authenticateRequest, likeRateLimiter, toggleCommentLike);
router.post('/:id/comment/:commentId/report', authenticateRequest, reportRateLimiter, reportComment);
router.post('/:id/like', attachUserIfPresent, likeRateLimiter, toggleWorkLike);
router.get('/:id', getWorkById);

export default router;
