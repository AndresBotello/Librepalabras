import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { commentRateLimiter, likeRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  createWork,
  getApprovedWorks,
  getWorkById,
  getMyWorks,
  getPendingWorks,
  reviewWork,
  getGenres,
  addRating,
  addComment,
  deleteComment,
  updateWork,
  toggleCommentLike,
  toggleWorkLike,
  getAllAuthors,
} from '../controllers/literature.controller.js';

const router = Router();

// Rutas públicas - PRIMERO las más específicas
router.get('/genres', getGenres);
router.get('/approved', getApprovedWorks);
router.get('/authors/all', getAllAuthors);

// Rutas autenticadas - RUTAS ESPECÍFICAS ANTES DE PARÁMETROS
router.post('/', authenticateRequest, createWork);
router.get('/user/my-works', authenticateRequest, getMyWorks);

// Rutas solo para admins
router.get('/admin/pending', authenticateRequest, authorizeRoles(['admin']), getPendingWorks);
router.patch('/:id/review', authenticateRequest, authorizeRoles(['admin']), reviewWork);

// Rutas con parámetro /:id - AL FINAL
router.patch('/:id', authenticateRequest, updateWork);
router.post('/:id/rate', authenticateRequest, addRating);
router.post('/:id/comment', authenticateRequest, commentRateLimiter, addComment);
router.delete('/:id/comment/:commentId', authenticateRequest, deleteComment);
router.post('/:id/comment/:commentId/like', authenticateRequest, likeRateLimiter, toggleCommentLike);
router.post('/:id/like', attachUserIfPresent, likeRateLimiter, toggleWorkLike);
router.get('/:id', getWorkById);

export default router;
