import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import {
  createPromotionalBook,
  getPromotionalBooks,
  getPromotionalBookById,
  updatePromotionalBook,
  deletePromotionalBook,
  toggleBookFavorite,
} from '../controllers/promotionalBooks.controller.js';

const router = Router();

// Rutas públicas
router.get('/', getPromotionalBooks);
router.get('/:id', getPromotionalBookById);

// Rutas autenticadas - solo admin
router.post('/', authenticateRequest, authorizeRoles(['admin']), createPromotionalBook);
router.patch('/:id', authenticateRequest, authorizeRoles(['admin']), updatePromotionalBook);
router.delete('/:id', authenticateRequest, authorizeRoles(['admin']), deletePromotionalBook);

// Rutas de favoritos - autenticadas opcionales
router.post('/:id/favorite', attachUserIfPresent, toggleBookFavorite);

export default router;
