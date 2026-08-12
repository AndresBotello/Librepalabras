/**
 * Grupos por capacidad, no por rol. Así una ruta declara *qué hace falta poder
 * hacer* en vez de repetir listas de roles, y añadir un rol nuevo se resuelve
 * aquí y no en veinte archivos.
 *
 * Publicar obra literaria y concursar son capacidades distintas, y por eso hay
 * dos grupos que no se solapan del todo:
 *
 *   - Un juez publica obra propia, pero no concursa en el certamen que él
 *     mismo califica.
 *   - Un `user` concursa, pero no publica en la biblioteca: para eso un
 *     administrador tiene que ascenderlo a colaborador.
 *   - Un administrador publica, pero se queda fuera del concurso, igual que
 *     antes de existir estos grupos.
 */
export const AUTHOR_ROLES = ['admin', 'collaborator', 'judge'];
export const CONTESTANT_ROLES = ['collaborator', 'user'];
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