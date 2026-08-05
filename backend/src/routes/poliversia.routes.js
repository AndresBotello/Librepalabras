import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import {
  getEditions,
  getEdition,
  createPoliversiaEdition,
  updatePoliversiaEdition,
  deletePoliversiaEdition,
} from '../controllers/poliversia.controller.js';

const router = Router();

// Públicas: `attachUserIfPresent` sirve para que un admin logueado vea también
// los borradores, sin bloquear al visitante anónimo.
router.get('/', attachUserIfPresent, getEditions);
router.get('/:id', attachUserIfPresent, getEdition);

// Escritura: solo administradores.
router.post('/', authenticateRequest, authorizeRoles(['admin']), createPoliversiaEdition);
router.patch('/:id', authenticateRequest, authorizeRoles(['admin']), updatePoliversiaEdition);
router.delete('/:id', authenticateRequest, authorizeRoles(['admin']), deletePoliversiaEdition);

export default router;
