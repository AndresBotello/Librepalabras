import { Router } from 'express';
import { attachUserIfPresent, authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { publicCommentRateLimiter, uploadRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  addSectionWorkComment,
  createSectionWork,
  deleteSectionWorkComment,
  deleteSectionWork,
  getSectionWork,
  getSectionWorkComments,
  getSectionWorkForEdit,
  getSectionWorks,
  getSectionWorksForAdmin,
  getSections,
  updateSectionWork,
} from '../controllers/section.controller.js';

const router = Router();

router.get('/', getSections);

// Gestión (solo admin). Va ANTES de las rutas con `:section`, o `admin` se
// interpretaría como el nombre de una sección.
router.get('/admin/works', authenticateRequest, authorizeRoles(['admin']), getSectionWorksForAdmin);

// Públicas: solo devuelven obras aprobadas, con los campos de lectura.
router.get('/:section/works', getSectionWorks);
router.get('/:section/works/:id', getSectionWork);

// Publicar exige sesión; QUIÉN puede hacerlo depende de la sección (los niños
// solo los sube un admin) y lo decide el manejador con `uploadRoles`.
// La moderación de lo que mande un colaborador es la de siempre:
// PATCH /api/literature/:id/review.
router.post('/:section/works', authenticateRequest, uploadRateLimiter, createSectionWork);
// Comentarios: como en las columnas, comentan también los visitantes (con
// captcha) y la ruta lleva su propio límite de frecuencia.
router.get('/:section/works/:id/comments', attachUserIfPresent, getSectionWorkComments);
router.post('/:section/works/:id/comments', attachUserIfPresent, publicCommentRateLimiter, addSectionWorkComment);
router.delete('/:section/works/:id/comments/:commentId', authenticateRequest, deleteSectionWorkComment);

router.get('/:section/works/:id/edit', authenticateRequest, getSectionWorkForEdit);
router.patch('/:section/works/:id', authenticateRequest, uploadRateLimiter, updateSectionWork);
router.delete('/:section/works/:id', authenticateRequest, authorizeRoles(['admin']), deleteSectionWork);

export default router;
