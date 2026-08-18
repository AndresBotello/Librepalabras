import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MailWarning, LogOut, ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext.jsx';
import { homeRouteForRole } from '../../utils/roles';
import { getInvitationByToken } from '../../services/api';

/**
 * Qué se ve al abrir un enlace de invitación con la sesión ya iniciada.
 *
 * Una invitación solo puede existir para un correo sin cuenta (el backend las
 * rechaza si ya hay usuario con esa dirección) y el rol solo se aplica al crear
 * la cuenta, así que quien llega aquí está siempre en una sesión distinta de la
 * invitada: el alta, tal cual, no le daría el rol prometido. En vez de rebotarle
 * al panel sin explicación se le dice qué pasa y se le ofrece la salida.
 */
export default function InvitacionSesionAbierta({ token }) {
  const { isDark } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  // null mientras se consulta; el correo invitado si el token sigue vivo. Si la
  // consulta falla se queda en null y el aviso se da sin nombrar la dirección:
  // el motivo de no poder continuar es el mismo con token válido o caducado.
  const [invitedEmail, setInvitedEmail] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getInvitationByToken(token)
      .then((response) => {
        if (!cancelled) setInvitedEmail(response.invitation.email);
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [token]);

  /**
   * Al cerrar sesión no se navega a ninguna parte: la guardia de ruta deja de
   * ver usuario y pinta el formulario de alta en esta misma URL, con el token
   * intacto. Así la invitación se acepta sin volver a abrir el enlace.
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const cardClasses = isDark
    ? 'bg-gray-900/90 border-gray-800 shadow-black/40'
    : 'bg-white border-gray-200/80 shadow-gray-200/50';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className={`w-full max-w-lg rounded-2xl shadow-xl border p-6 sm:p-8 transition-colors ${cardClasses}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <MailWarning className="w-6 h-6" />
          </div>

          <h1 className={`text-2xl font-bold tracking-tight mb-3 transition-colors ${isDark ? 'text-gray-100' : 'text-brand-700'}`}>
            Ya tienes una sesión abierta
          </h1>

          <p className={`text-sm leading-relaxed mb-3 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {invitedEmail ? (
              <>
                Esta invitación es para <strong className={isDark ? 'text-gray-200' : 'text-gray-800'}>{invitedEmail}</strong>, una
                cuenta que todavía no existe. Ahora mismo estás dentro como{' '}
                <strong className={isDark ? 'text-gray-200' : 'text-gray-800'}>{user?.email}</strong>.
              </>
            ) : (
              <>
                Esta invitación sirve para crear una cuenta nueva, y ahora mismo estás dentro como{' '}
                <strong className={isDark ? 'text-gray-200' : 'text-gray-800'}>{user?.email}</strong>.
              </>
            )}
          </p>

          <p className={`text-sm leading-relaxed mb-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            El rol de la invitación solo se concede al registrar esa dirección, así que para aceptarla tienes que cerrar
            la sesión actual. El enlace se conserva: al salir volverás aquí, al formulario de alta.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-amber-500 text-gray-950 hover:bg-amber-400'
                  : 'bg-brand-700 text-white hover:bg-brand-800'
              }`}
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión y continuar'}
            </button>

            <Link
              to={homeRouteForRole(user?.role)}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all ${
                isDark
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Ir a mi panel
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
