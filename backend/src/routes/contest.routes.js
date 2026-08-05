import { Router } from 'express';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles, JURY_ROLES } from '../middlewares/role.middleware.js';
import { contestSubmissionRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  getPublishedStories,
  getPublishedStory,
  submitStory,
  getMyStory,
  updateMyStory,
  getEvaluationPanel,
  rateStory,
  getStoryRatings,
  setStoryPublication,
  setStoryEvaluation,
  deleteStory,
} from '../controllers/contest.controller.js';

const router = Router();

// Públicas: únicamente cuentos publicados, sin notas ni comentarios.
router.get('/published', getPublishedStories);
router.get('/published/:id', getPublishedStory);

// Solo colaborador, a propósito: un juez puede publicar obra literaria propia,
// pero no concursar en el certamen que él mismo califica.
router.get('/mine', authenticateRequest, authorizeRoles(['collaborator']), getMyStory);
router.post('/', authenticateRequest, authorizeRoles(['collaborator']), contestSubmissionRateLimiter, submitStory);
router.patch('/mine/:id', authenticateRequest, authorizeRoles(['collaborator']), updateMyStory);

// Jurado: panel de calificación y decisión de publicar.
router.get('/panel', authenticateRequest, authorizeRoles(JURY_ROLES), getEvaluationPanel);
router.get('/:id/ratings', authenticateRequest, authorizeRoles(JURY_ROLES), getStoryRatings);
router.post('/:id/rating', authenticateRequest, authorizeRoles(JURY_ROLES), rateStory);
router.patch('/:id/publication', authenticateRequest, authorizeRoles(JURY_ROLES), setStoryPublication);
router.patch('/:id/evaluation', authenticateRequest, authorizeRoles(JURY_ROLES), setStoryEvaluation);

// Retirar un cuento del concurso es irreversible: solo admin.
router.delete('/:id', authenticateRequest, authorizeRoles(['admin']), deleteStory);

export default router;
