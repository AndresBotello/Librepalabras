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

const router = Router();

router.get('/', attachUserIfPresent, getOpinionColumns);
router.get('/mine', authenticateRequest, authorizeRoles(AUTHOR_ROLES), getMyOpinionColumns);
router.get('/:id', attachUserIfPresent, getOpinionColumnById);

router.post('/', authenticateRequest, authorizeRoles(AUTHOR_ROLES), createOpinionColumn);
router.patch('/:id', authenticateRequest, authorizeRoles(AUTHOR_ROLES), updateOpinionColumn);
router.patch('/:id/review', authenticateRequest, authorizeRoles(['admin']), reviewOpinionColumn);
router.delete('/:id', authenticateRequest, authorizeRoles(AUTHOR_ROLES), deleteOpinionColumn);

export default router;
