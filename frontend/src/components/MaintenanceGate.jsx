import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getSiteConfig } from '../services/api';

/**
 * Puerta de mantenimiento.
 *
 * El backend ya devuelve 503 a todo el mundo menos a los administradores; esto
 * es la cara visible de esa decisión: sin ella el visitante vería una sucesión
 * de errores de red sin explicación.
 *
 * El admin no queda bloqueado, pero sí ve un aviso permanente: es fácil
 * olvidarse el modo activado y no enterarse, porque para él todo funciona.
 */

const RECHECK_MS = 60000;

export default function MaintenanceGate({ children }) {
  const { isDark } = useContext(ThemeContext);
  const { user, loading: authLoading } = useAuth();

  const [config, setConfig] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const response = await getSiteConfig();

        if (!cancelled && response.ok) {
          setConfig(response.config);
        }
      } catch {
        // Si la comprobación falla se deja pasar: un backend caído ya se
        // manifestará en las pantallas, y bloquear aquí ocultaría el problema
        // real tras un cartel de mantenimiento que no es cierto.
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    check();

    // Reconsulta periódica para que quien esté esperando vea el sitio volver
    // sin tener que recargar a mano.
    const intervalId = setInterval(check, RECHECK_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const isAdmin = user?.role === 'admin';
  const inMaintenance = Boolean(config?.maintenanceMode);

  // Mientras no se sepa si hay sesión, no se puede decidir: mostrar la pantalla
  // de mantenimiento a un admin que aún está cargando sería un parpadeo feo.
  if (!checked || authLoading) {
    return children;
  }

  if (inMaintenance && !isAdmin) {
    return <MaintenanceScreen config={config} isDark={isDark} />;
  }

  return (
    <>
      {inMaintenance && isAdmin && <AdminMaintenanceBanner isDark={isDark} />}
      {children}
    </>
  );
}

function MaintenanceScreen({ config, isDark }) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center px-6 transition-colors ${
        isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-stone-800'
      }`}
    >
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: 'var(--color-brand-700)' }}
          aria-hidden="true"
        >
          🛠️
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          {config?.siteTitle || 'Liberapalabras'} está en mantenimiento
        </h1>

        <p className={`text-base leading-relaxed mb-8 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
          {config?.maintenanceMessage
            || 'Estamos realizando tareas de mantenimiento. Volvemos en unos minutos.'}
        </p>

        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-stone-500'}`}>
          Esta página se actualiza sola en cuanto el sitio vuelva.
        </p>

        <Link
          to="/login"
          className={`inline-block mt-8 text-sm font-medium underline underline-offset-4 ${
            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Soy administrador, iniciar sesión
        </Link>
      </div>
    </div>
  );
}

function AdminMaintenanceBanner({ isDark }) {
  return (
    <div
      role="status"
      className={`fixed bottom-0 left-0 right-0 z-[60] px-4 py-2.5 text-center text-sm font-semibold ${
        isDark ? 'bg-amber-900 text-amber-100' : 'bg-amber-500 text-amber-950'
      }`}
    >
      🛠️ Modo mantenimiento activo — el sitio está cerrado al público.{' '}
      <Link to="/admin/settings" className="underline underline-offset-2">
        Desactivar
      </Link>
    </div>
  );
}
