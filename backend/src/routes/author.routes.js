import { Router } from 'express';
import { authenticateRequest, attachUserIfPresent } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import {
  getAuthorById,
  getAuthors,
  patchAuthor,
  postAuthor,
  removeAuthor,
} from '../controllers/author.controller.js';

const router = Router();

// El catálogo es público: es lo que se ve en /authors y en la portada.
// `attachUserIfPresent` deja que un admin logueado siga viendo el userId de
// cada ficha (lo necesita el panel de autores para no enlazar dos veces la
// misma cuenta) sin exigir sesión al visitante anónimo.
router.get('/', attachUserIfPresent, getAuthors);
router.get('/:id', attachUserIfPresent, getAuthorById);

// Quién entra al catálogo lo decide el administrador, y nadie más. No hay
// ninguna vía por la que la aplicación cree fichas sola.
router.post('/', authenticateRequest, authorizeRoles(['admin']), postAuthor);
router.patch('/:id', authenticateRequest, authorizeRoles(['admin']), patchAuthor);
router.delete('/:id', authenticateRequest, authorizeRoles(['admin']), removeAuthor);

export default router;
