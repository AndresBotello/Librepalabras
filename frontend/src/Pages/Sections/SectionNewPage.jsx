import { useContext } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SectionWorkForm from '../../components/SectionWorkForm';
import { canPublishIn } from '../../config/sections';
import { homeRouteForRole } from '../../utils/roles';

/**
 * Pantalla para publicar en una sección. Redirige a quien no puede hacerlo, pero
 * eso es cortesía: la puerta real es el servidor, que revisa el rol en cada
 * envío.
 */
export default function SectionNewPage({ section }) {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  if (!canPublishIn(section, user?.role)) {
    return <Navigate to={section.path} replace />;
  }

  const isAdmin = user.role === 'admin';

  // Volver a donde estaba quien llegó aquí (el panel, la gestión...). Si abrió
  // el formulario directamente y no hay nada atrás, al panel de su rol.
  const goBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(homeRouteForRole(user.role));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar />

      <main className="flex-1 px-4 sm:px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={goBack}
            className={`text-sm ${isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'}`}
          >
            ← Volver
          </button>

          <h1 className={`text-3xl font-serif font-bold mt-3 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Publicar en {section.label}
          </h1>
          <p className={`mb-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isAdmin
              ? 'Lo que publiques como administrador aparece de inmediato.'
              : 'Tu aporte será revisado por el equipo editorial antes de publicarse.'}
          </p>

          <div className={`rounded-lg p-6 sm:p-8 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <SectionWorkForm
              section={section}
              isDark={isDark}
              onSuccess={(response) => notify.success(response?.message || 'Listo')}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
