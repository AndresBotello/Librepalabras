import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Clock, Loader2, PenLine, Users } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import useContestCatalog from '../../hooks/useContestCatalog';
import { getPublishedContestStories } from '../../services/api';
import { canEnterContests, contestRouteForRole } from '../../utils/roles';

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function excerpt(text, length = 180) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

/**
 * Página de un concurso concreto. La ruta trae el slug del catálogo, así que
 * /concursos/cuento-corto sigue funcionando igual que antes.
 *
 * El `key` monta una página nueva al cambiar de concurso: así no se arrastra
 * el cuento abierto ni la lista del certamen anterior.
 */
export default function ConcursoRoute() {
  const { slug } = useParams();
  return <Concurso key={slug} slug={slug} />;
}

function Concurso({ slug }) {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const { contests } = useContestCatalog();

  // El estado (abierto / próximamente / cerrado) lo pone el administrador, así
  // que sale del catálogo del backend, no del archivo local.
  const contest = contests.find((item) => item.slug === slug) || null;
  const contestId = contest?.id;

  const isComingSoon = contest?.status === 'proximamente';

  // La página pública no decía nada a quien sí puede concursar: un `user` con la
  // sesión abierta la leía igual que un visitante y tenía que dar con el
  // formulario por su cuenta. El acceso sale del rol, y cada rol entra por su
  // área (`/usuario/concurso` o `/collaborator/concurso`).
  const isOpen = contest?.status === 'abierto';
  const canEnter = canEnterContests(user?.role);

  const [stories, setStories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(Boolean(contestId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contestId) return undefined;

    let active = true;

    getPublishedContestStories(contestId)
      .then((response) => {
        if (active) setStories(response.stories || []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudieron cargar los cuentos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [contestId]);

  useEffect(() => {
    if (selected) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selected]);

  const backToContests = (
    <Link
      to="/concursos"
      className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors ${
        isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:underline'
      }`}
    >
      <ArrowLeft className="w-4 h-4" />
      Todos los concursos
    </Link>
  );

  if (!contest) {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-12">
          {backToContests}
          <h1 className={`text-3xl font-serif font-bold mb-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Este concurso no existe
          </h1>
          <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Puede que la convocatoria haya cambiado de dirección. Revisa la lista de concursos.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12">
        {selected ? (
          <article className="max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors ${
                isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:underline'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a los cuentos
            </button>

            {selected.imageUrl && (
              <img
                src={selected.imageUrl}
                alt={`Ilustración de ${selected.title}`}
                className="w-full aspect-[16/9] object-cover rounded-2xl mb-8"
              />
            )}

            <h1 className={`text-3xl sm:text-4xl font-serif font-bold mb-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              {selected.title}
            </h1>

            <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-10 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              <span className="font-semibold">{selected.authorName}</span>
              {selected.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(selected.publishedAt)}
                  </span>
                </>
              )}
            </p>

            {/* `whitespace-pre-wrap` conserva los saltos de línea que escribió el
                autor sin tener que renderizar HTML del usuario. */}
            <div className={`whitespace-pre-wrap text-base sm:text-lg leading-relaxed font-serif ${
              isDark ? 'text-stone-300' : 'text-stone-800'
            }`}>
              {selected.content}
            </div>
          </article>
        ) : (
          <>
            {backToContests}

            <header className="mb-12">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {isComingSoon ? 'Próximamente' : 'Concurso'}
                </span>
                {contest.edition && (
                  <span className={`text-xs font-semibold tabular-nums ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                    {`Edición ${contest.edition}`}
                  </span>
                )}
              </div>

              <h1 className={`text-4xl sm:text-5xl font-serif font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                {contest.name}
              </h1>

              <p className={`max-w-2xl text-base sm:text-lg leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {contest.description}
              </p>

              <p className={`inline-flex items-center gap-1.5 text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                <Users className="w-3.5 h-3.5" />
                {contest.audience}
              </p>

              {isOpen && canEnter && (
                <div className="mt-6">
                  <Link
                    to={contestRouteForRole(user?.role)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                    Presentar mi cuento
                  </Link>
                </div>
              )}

              {isOpen && !user && (
                <p className={`mt-6 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  <Link to="/login" className={`font-semibold underline ${isDark ? 'text-amber-400' : 'text-brand-700'}`}>
                    Inicia sesión
                  </Link>{' '}
                  para presentar tu cuento a esta convocatoria.
                </p>
              )}
            </header>

            {isComingSoon && (
              <div className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
                isDark ? 'border-stone-800 text-stone-400' : 'border-stone-300 text-stone-600'
              }`}>
                <Clock className="w-10 h-10 mx-auto mb-4 opacity-40" />
                <p className="text-sm max-w-md mx-auto">
                  La convocatoria de este concurso todavía no está abierta. Cuando lo esté,
                  aquí aparecerán las bases y los cuentos publicados.
                </p>
              </div>
            )}

            {!isComingSoon && loading && (
              <div className={`flex items-center justify-center gap-3 py-24 text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cargando cuentos…
              </div>
            )}

            {!isComingSoon && !loading && error && (
              <div className={`rounded-2xl border px-6 py-5 text-sm ${
                isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {error}
              </div>
            )}

            {!isComingSoon && !loading && !error && stories.length === 0 && (
              <div className={`rounded-2xl border border-dashed px-6 py-20 text-center ${
                isDark ? 'border-stone-800 text-stone-400' : 'border-stone-300 text-stone-600'
              }`}>
                <PenLine className="w-10 h-10 mx-auto mb-4 opacity-40" />
                <p className="text-sm">Todavía no hay cuentos publicados. Vuelve pronto.</p>
              </div>
            )}

            {!isComingSoon && !loading && !error && stories.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => setSelected(story)}
                    className={`group text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:shadow-amber-900/10 ${
                      isDark
                        ? 'bg-stone-900 border-stone-800 hover:border-amber-500/40'
                        : 'bg-white border-stone-200 hover:border-amber-600/40'
                    }`}
                  >
                    <div className={`relative aspect-[16/10] overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                      {story.imageUrl ? (
                        <img
                          src={story.imageUrl}
                          alt={`Ilustración de ${story.title}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className={`w-10 h-10 ${isDark ? 'text-stone-700' : 'text-stone-300'}`} />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h2 className={`font-serif font-bold text-lg leading-snug line-clamp-2 mb-2 ${
                        isDark ? 'text-stone-100' : 'text-stone-900'
                      }`}>
                        {story.title}
                      </h2>

                      <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-amber-400' : 'text-brand-700'}`}>
                        {story.authorName}
                      </p>

                      <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                        {excerpt(story.content)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
