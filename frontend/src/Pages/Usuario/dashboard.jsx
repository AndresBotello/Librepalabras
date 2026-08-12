import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AreaSidebar from '../../components/AreaSidebar';
import { getMyContestStories } from '../../services/api';

/**
 * Panel de quien todavía no publica en la biblioteca. Concursar sí puede desde
 * el primer día, así que la pantalla se organiza alrededor de eso y deja claro
 * —sin prometer nada— qué falta para poder publicar obra propia.
 */

const Icons = {
  Quill: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function UsuarioDashboard() {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStories = async () => {
      try {
        const response = await getMyContestStories();
        if (!cancelled && response.ok && response.stories) {
          setStories(response.stories);
        }
      } catch (err) {
        // El panel tiene que abrirse aunque el concurso falle: sin cuentos se
        // muestra el estado vacío, que es lo mismo que ve quien aún no participa.
        console.error('Error cargando tus cuentos del concurso:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStories();

    return () => { cancelled = true; };
  }, []);

  const published = stories.filter((story) => story.isPublished).length;
  const inReview = stories.length - published;

  const stats = [
    { label: 'Cuentos presentados', value: stories.length, icon: Icons.Quill },
    { label: 'En evaluación', value: inReview, icon: Icons.Clock },
    { label: 'Publicados', value: published, icon: Icons.Check },
  ];

  const cardClass = isDark
    ? 'bg-gray-900 border-gray-800'
    : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Navbar />

      <div className="flex flex-1 flex-col md:flex-row max-w-7xl w-full mx-auto">
        <main className="flex-1 px-4 sm:px-8 py-8">
          <header className="mb-8">
            <h1 className={`font-serif text-3xl sm:text-4xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Desde aquí sigues tus cuentos a concurso y mantienes tus datos al día.
            </p>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`rounded-xl border p-5 transition-colors ${cardClass}`}>
                  <div className={`inline-flex p-2.5 rounded-xl mb-3 ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                    <Icon />
                  </div>
                  <p className={`text-3xl font-extrabold tabular-nums ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </section>

          <section className={`rounded-xl border p-6 mb-6 transition-colors ${cardClass}`}>
            <h2 className={`font-serif text-xl font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Tus cuentos a concurso
            </h2>

            {loading ? (
              <p className={`text-sm py-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargando…</p>
            ) : stories.length === 0 ? (
              <>
                <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Todavía no has presentado ninguno. Las convocatorias abiertas aceptan tu cuento
                  aunque acabes de crear la cuenta.
                </p>
                <Link
                  to="/usuario/concurso"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-700 text-white hover:bg-brand-800 transition-colors"
                >
                  Ver convocatorias
                </Link>
              </>
            ) : (
              <ul className="divide-y mt-4">
                {stories.map((story) => (
                  <li key={story.id} className={`py-3 flex items-center justify-between gap-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {story.title}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${
                      story.isPublished
                        ? isDark ? 'bg-emerald-950/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        : isDark ? 'bg-amber-950/50 text-amber-300' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {story.isPublished ? 'Publicado' : 'En evaluación'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`rounded-xl border p-6 transition-colors ${cardClass}`}>
            <h2 className={`font-serif text-xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              ¿Quieres publicar tu obra en la biblioteca?
            </h2>
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Publicar obra propia está reservado a los colaboradores. Es el equipo de
              LiberaPalabras quien concede ese permiso desde el panel de administración.
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Mientras tanto, completa tu <Link to="/usuario/perfil" className={`font-semibold underline ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>perfil</Link>{' '}
              con tu biografía y tu foto: son los datos que se usan si más adelante entras en el
              catálogo de autores.
            </p>
          </section>
        </main>

        <AreaSidebar />
      </div>

      <Footer />
    </div>
  );
}
