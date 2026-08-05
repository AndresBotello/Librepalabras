export const ROLE_LABELS = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
  judge: 'Juez',
};

/**
 * Dónde vive cada rol al entrar. Lo usan tanto el login como ProtectedRoute al
 * expulsar a alguien de una ruta que no le corresponde; tenerlo en un solo sitio
 * evita que un rol acabe redirigido a una página que tampoco puede ver, que es
 * como se producen los bucles de redirección.
 */
export function homeRouteForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'judge':
      return '/concursos/panel';
    default:
      return '/collaborator/dashboard';
  }
}
