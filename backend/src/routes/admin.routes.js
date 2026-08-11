import { Router } from 'express';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import {
  getAdminOverview,
  updateUserRole,
  getAllUsers,
  testAdminAuth,
  getUserById,
  updateUserById,
  updateUserStatus,
  getPdfFiles,
  deletePdfFile,
} from '../controllers/admin.controller.js';
import {
  getCommentReports,
  getCommentReportsCount,
  resolveCommentReport,
} from '../controllers/moderation.controller.js';
import {
  deleteInvitation,
  getInvitations,
  postInvitation,
} from '../controllers/invitation.controller.js';
import {
  deleteErrorLogs,
  deleteOrphanFile,
  getHealthReport,
} from '../controllers/health.controller.js';

const router = Router();

// Ruta de prueba - solo requiere autenticación
router.get('/test', authenticateRequest, testAdminAuth);

// Todas las demás rutas requieren autenticación + rol admin
router.use(authenticateRequest, authorizeRoles(['admin']));

// Rutas de overview y usuarios
router.get('/overview', getAdminOverview);
router.get('/users', getAllUsers);

// Rutas para usuario individual
router.get('/users/:uid', getUserById);
router.patch('/users/:uid', updateUserById);
router.patch('/users/:uid/role', updateUserRole);
router.patch('/users/:uid/status', updateUserStatus);

// Rutas para gestión de archivos PDF
router.get('/files', getPdfFiles);
router.delete('/files/:id', deletePdfFile);

// Moderación de comentarios reportados
router.get('/comment-reports', getCommentReports);
router.get('/comment-reports/count', getCommentReportsCount);
router.patch('/comment-reports/:id', resolveCommentReport);

// Invitaciones con rol preasignado
router.get('/invitations', getInvitations);
router.post('/invitations', postInvitation);
router.delete('/invitations/:id', deleteInvitation);

// Estado del sistema
router.get('/health', getHealthReport);
router.delete('/health/errors', deleteErrorLogs);
router.post('/health/orphans/delete', deleteOrphanFile);

export default router;
