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
} from '../controllers/admin.controller.js';

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

export default router;