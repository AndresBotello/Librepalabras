import { attachUserIfPresent } from './auth.middleware.js';
import { getSettings } from '../services/siteConfig.service.js';

/**
 * Corta la API cuando el administrador activa el modo mantenimiento.
 *
 * Dos cuidados que hacen la diferencia entre una función útil y un candado sin
 * llave:
 *
 * 1. Las rutas de sesión y de configuración quedan siempre abiertas. Si se
 *    bloquearan, un admin que no tuviera sesión iniciada en ese momento no
 *    podría entrar a desactivar el modo, y la única salida sería editar
 *    Firestore a mano.
 * 2. La comprobación de rol solo se hace cuando el modo está activo. En
 *    operación normal esto cuesta una lectura de un objeto en memoria, no una
 *    consulta a Firestore ni una verificación de cookie.
 */

const ALWAYS_ALLOWED = [
  '/api/auth/session',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/site/config',
];

function isAllowedDuringMaintenance(path) {
  return ALWAYS_ALLOWED.some((allowed) => path === allowed || path.startsWith(`${allowed}/`));
}

// `attachUserIfPresent` nunca responde por su cuenta —siempre llama a next()—,
// así que envolverlo en una promesa es seguro: no puede dejar la petición colgada.
function resolveOptionalUser(req, res) {
  return new Promise((resolve) => {
    attachUserIfPresent(req, res, resolve);
  });
}

export async function maintenanceGuard(req, res, next) {
  try {
    if (isAllowedDuringMaintenance(req.path)) {
      return next();
    }

    const settings = await getSettings();

    if (!settings.maintenanceMode) {
      return next();
    }

    await resolveOptionalUser(req, res);

    if (req.user?.role === 'admin') {
      return next();
    }

    return res.status(503).json({
      ok: false,
      code: 'maintenance-mode',
      message: settings.maintenanceMessage,
    });
  } catch (error) {
    // Un fallo aquí no debe tumbar el sitio: ante la duda se deja pasar, que es
    // el estado normal, en vez de bloquear a todo el mundo por un error de lectura.
    console.error('Error en el control de mantenimiento:', error.message);
    return next();
  }
}
