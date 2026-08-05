/**
 * Grupos por capacidad, no por rol. Así una ruta declara *qué hace falta poder
 * hacer* en vez de repetir listas de roles, y añadir un rol nuevo se resuelve
 * aquí y no en veinte archivos.
 *
 * Un juez sí puede publicar obra propia; lo que no puede es concursar en el
 * certamen que él mismo califica (esa ruta pide 'collaborator' a secas).
 */
export const AUTHOR_ROLES = ['admin', 'collaborator', 'judge'];
export const JURY_ROLES = ['admin', 'judge'];

export function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    const currentRole = req.user?.role;

    if (!currentRole) {
      return res.status(403).json({
        ok: false,
        message: 'No se pudo determinar el rol del usuario',
      });
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    return next();
  };
}