import React from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { homeRouteForRole } from '../utils/roles';
import InvitacionSesionAbierta from '../Pages/Auth/invitacion.jsx';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const loading = auth?.loading ?? false;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeRouteForRole(user.role)} replace />;
  }

  return children;
}

/**
 * Lo contrario del guardia de arriba: pantallas que solo tienen sentido sin
 * sesión abierta (acceso y alta). Sin esto bastaba con darle a "atrás" en el
 * navegador justo después de entrar para volver al formulario de acceso y
 * encadenar el inicio de otra cuenta encima de la primera, sin pasar por cerrar
 * sesión. Es una guardia de ruta y no solo un `replace` en el login porque el
 * historial no es la única forma de llegar: teclear la URL o un enlace guardado
 * dejan igual de accesible el formulario.
 */
export function GuestRoute({ children }) {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const user = auth?.user ?? null;
  const loading = auth?.loading ?? false;
  const inviteToken = searchParams.get('invite');

  // Mientras se comprueba la sesión no se pinta el formulario: si no, aparece un
  // instante antes de la redirección cada vez que se recarga la página.
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Cargando...</div>;
  }

  // Un enlace de invitación es la excepción a la redirección muda: quien lo abre
  // venía a hacer algo concreto, y mandarle al panel sin decir nada parece que
  // el enlace estuviera roto. Se le explica por qué no puede seguir así.
  if (user && inviteToken) {
    return <InvitacionSesionAbierta token={inviteToken} />;
  }

  if (user) {
    return <Navigate to={homeRouteForRole(user.role)} replace />;
  }

  return children;
}
