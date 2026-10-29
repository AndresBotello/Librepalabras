import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles, AUTHOR_ROLES } from '../middlewares/role.middleware.js';
import {
  getOpinionColumns,
  getMyOpinionColumns,
  getOpinionColumnById,
  createOpinionColumn,
  updateOpinionColumn,
  reviewOpinionColumn,
  deleteOpinionColumn,
} from '../controllers/opinionColumn.controller.js';
import {
  getOpinionColumnComments,
  addOpinionColumnComment,
  deleteOpinionColumnComment,
} from '../controllers/opinionColumnComment.controller.js';
import { publicCommentRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.get('/', attachUserIfPresent, getOpinionColumns);
router.get('/mine', authenticateRequest, authorizeRoles(AUTHOR_ROLES), getMyOpinionColumns);
router.get('/:id', attachUserIfPresent, getOpinionColumnById);

// Comentarios: leer y escribir está abierto a visitantes sin cuenta (con captcha
// y límite por IP en la escritura); borrar exige sesión. `attachUserIfPresent`
// va antes del limitador porque este exime a los administradores.
router.get('/:id/comments', attachUserIfPresent, getOpinionColumnComments);
router.post('/:id/comments', attachUserIfPresent, publicCommentRateLimiter, addOpinionColumnComment);
router.delete('/:id/comments/:commentId', authenticateRequest, deleteOpinionColumnComment);

router.post('/', authenticateRequest, authorizeRoles(AUTHOR_ROLES), createOpinionColumn);
router.patch('/:id', authenticateRequest, authorizeRoles(AUTHOR_ROLES), updateOpinionColumn);
router.patch('/:id/review', authenticateRequest, authorizeRoles(['admin']), reviewOpinionColumn);
router.delete('/:id', authenticateRequest, authorizeRoles(AUTHOR_ROLES), deleteOpinionColumn);

export default router;
