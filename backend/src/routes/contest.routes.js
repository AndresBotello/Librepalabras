import { Router } from 'express';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles, CONTESTANT_ROLES, JURY_ROLES } from '../middlewares/role.middleware.js';
import { contestSubmissionRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  getCatalog,
  getPublishedStories,
  getPublishedStory,
  getWinners,
  setContestState,
  submitStory,
  getMyStories,
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
router.get('/catalog', getCatalog);
router.get('/published', getPublishedStories);
router.get('/winners', getWinners);
router.get('/published/:id', getPublishedStory);

// Abrir, anunciar o cerrar una convocatoria es decisión del administrador.
router.patch('/catalog/:id', authenticateRequest, authorizeRoles(['admin']), setContestState);

// Concursar no exige poder publicar en la biblioteca: un `user` recién
// registrado puede presentarse. Quien queda fuera es el juez, que no puede
// concursar en el certamen que él mismo califica.
router.get('/mine', authenticateRequest, authorizeRoles(CONTESTANT_ROLES), getMyStories);
router.post('/', authenticateRequest, authorizeRoles(CONTESTANT_ROLES), contestSubmissionRateLimiter, submitStory);
router.patch('/mine/:id', authenticateRequest, authorizeRoles(CONTESTANT_ROLES), updateMyStory);

// Jurado: panel de calificación y decisión de publicar.
router.get('/panel', authenticateRequest, authorizeRoles(JURY_ROLES), getEvaluationPanel);
router.get('/:id/ratings', authenticateRequest, authorizeRoles(JURY_ROLES), getStoryRatings);
router.post('/:id/rating', authenticateRequest, authorizeRoles(JURY_ROLES), rateStory);
router.patch('/:id/publication', authenticateRequest, authorizeRoles(JURY_ROLES), setStoryPublication);
router.patch('/:id/evaluation', authenticateRequest, authorizeRoles(JURY_ROLES), setStoryEvaluation);

// Retirar un cuento del concurso es irreversible: solo admin.
router.delete('/:id', authenticateRequest, authorizeRoles(['admin']), deleteStory);

export default router;
