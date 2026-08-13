export const ROLE_LABELS = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
  judge: 'Juez',
  user: 'Usuario',
};

/**
 * Dónde vive cada rol al entrar. Lo usan tanto el login como ProtectedRoute al
 * expulsar a alguien de una ruta que no le corresponde; tenerlo en un solo sitio
 * evita que un rol acabe redirigido a una página que tampoco puede ver, que es
 * como se producen los bucles de redirección.
 *
 * Por eso el caso por defecto apunta al área de usuario y no a la de
 * colaborador: es la única que cualquier sesión puede abrir, así que un rol que
 * no estuviera contemplado aterriza en algo visible en lugar de rebotar entre
 * dos rutas prohibidas hasta agotar el navegador.
 */
export function homeRouteForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'judge':
      return '/concursos/panel';
    case 'collaborator':
      return '/collaborator/dashboard';
    default:
      return '/usuario/dashboard';
  }
}

/** Publicar obra en la biblioteca. Coincide con AUTHOR_ROLES del backend. */
export function canPublishWorks(role) {
  return ['admin', 'collaborator', 'judge'].includes(role);
}

/**
 * El perfil es la misma pantalla para todos, pero vive detrás de dos rutas con
 * guardias distintas. Enlazar siempre a la de colaborador dejaba fuera al
 * usuario normal: su guardia lo rebotaba al dashboard, y desde el menú de
 * cuenta parecía que la app no supiera qué rol tiene.
 */
export function profileRouteForRole(role) {
  return canPublishWorks(role) ? '/collaborator/profile' : '/usuario/perfil';
}

/** Inscribirse al concurso. Coincide con CONTESTANT_ROLES del backend. */
export function canEnterContests(role) {
  return ['collaborator', 'user'].includes(role);
}

/** Formulario de inscripción al concurso, en el área que corresponde al rol. */
export function contestRouteForRole(role) {
  return canPublishWorks(role) ? '/collaborator/concurso' : '/usuario/concurso';
}
