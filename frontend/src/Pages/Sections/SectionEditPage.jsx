import { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/DialogContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SectionWorkForm from '../../components/SectionWorkForm';
import { getSectionWorkForEdit } from '../../services/api';
import { canPublishIn } from '../../config/sections';
import { homeRouteForRole } from '../../utils/roles';

/**
 * Pantalla para editar una obra de sección. Como la de publicar, redirige a quien
 * no puede por cortesía: el servidor vuelve a comprobar el rol y la autoría en
 * la carga y en cada guardado.
 */
export default function SectionEditPage({ section }) {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // El resultado lleva el id con el que se pidió: mientras no coincida con el
  // de la URL, la pantalla está cargando.
  const [loaded, setLoaded] = useState({ id: null, work: null, error: '' });

  useEffect(() => {
    let cancelled = false;

    getSectionWorkForEdit(section.value, id)
      .then((response) => {
        if (!cancelled) setLoaded({ id, work: response.work, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setLoaded({ id, work: null, error: err.message });
      });

    return () => { cancelled = true; };
  }, [section.value, id]);

  if (!canPublishIn(section, user?.role)) {
    return <Navigate to={section.path} replace />;
  }

  const goBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(homeRouteForRole(user.role));
    }
  };

  const ready = loaded.id === id;
  const isAdmin = user.role === 'admin';

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
            Editar en {section.label}
          </h1>
          <p className={`mb-8 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isAdmin
              ? 'Los cambios se publican de inmediato.'
              : 'Al guardar, tu aporte vuelve a revisión antes de mostrarse de nuevo.'}
          </p>

          {!ready && <p className="py-12 text-center animate-pulse">Cargando…</p>}
          {ready && loaded.error && <p className="py-12 text-center text-red-500">{loaded.error}</p>}

          {ready && loaded.work && (
            <div className={`rounded-lg p-6 sm:p-8 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <SectionWorkForm
                // `key`: otra obra es otro formulario, con su propio estado.
                key={loaded.work.id}
                section={section}
                work={loaded.work}
                isDark={isDark}
                onSuccess={(response) => {
                  notify.success(response?.message || 'Cambios guardados');
                  goBack();
                }}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
