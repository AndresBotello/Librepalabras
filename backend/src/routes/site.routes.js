import { Router } from 'express';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import {
  getAdminSettings,
  getHome,
  getPublicConfig,
  patchHome,
  patchSettings,
} from '../controllers/site.controller.js';

const router = Router();

// Públicas: el visitante necesita la configuración para saber si el sitio está
// en mantenimiento, y la portada para pintarse.
router.get('/config', getPublicConfig);
router.get('/home', getHome);

// Escritura: solo administradores.
router.get('/admin/settings', authenticateRequest, authorizeRoles(['admin']), getAdminSettings);
router.patch('/admin/settings', authenticateRequest, authorizeRoles(['admin']), patchSettings);
router.patch('/admin/home', authenticateRequest, authorizeRoles(['admin']), patchHome);

export default router;
