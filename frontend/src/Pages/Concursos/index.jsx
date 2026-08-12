import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Loader2, Trophy, Users } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import HomenajeEscallon from '../../components/HomenajeEscallon';
import { ThemeContext } from '../../context/ThemeContext';
import useContestCatalog from '../../hooks/useContestCatalog';
import { getPublishedContestStories } from '../../services/api';
import { CONTEST_STATUS_META } from '../../utils/contests';

/** Colores del distintivo según el estado del concurso. */
function statusClasses(status, isDark) {
  const tone = CONTEST_STATUS_META[status]?.tone || 'stone';

  const palettes = {
    emerald: isDark ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: isDark ? 'bg-amber-950/50 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200',
    stone: isDark ? 'bg-stone-800 text-stone-300 border-stone-700' : 'bg-stone-100 text-stone-600 border-stone-300',
  };

  return palettes[tone];
}

export default function Concursos() {
  const { isDark } = useContext(ThemeContext);
  const { contests } = useContestCatalog();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Una sola petición para todos los cuentos publicados: cada tarjeta cuenta
  // los suyos en memoria en vez de pedir una lista por concurso.
  useEffect(() => {
    let active = true;

    getPublishedContestStories()
      .then((response) => {
        if (active) setStories(response.stories || []);
      })
      .catch(() => {
        if (active) setStories([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const publishedByContest = useMemo(() => {
    return stories.reduce((counts, story) => {
      counts[story.contestId] = (counts[story.contestId] || 0) + 1;
      return counts;
    }, {});
  }, [stories]);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-stone-950' : 'bg-stone-50'}`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12">
        <header className="mb-12">
          <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
            Convocatorias
          </span>
          <h1 className={`text-4xl sm:text-5xl font-serif font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Concursos Literarios Amhed Escallón Gamarra
          </h1>
          <p className={`max-w-2xl text-base sm:text-lg leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Los certámenes de Liberapalabras: cuento corto, poesía y microrrelato. Cada uno
            con su propia convocatoria, su jurado y los textos que se publican al final.
          </p>
        </header>

        {/* Abre la página, antes de las convocatorias. */}
        <HomenajeEscallon />

        {/* Acceso a los ganadores de ediciones anteriores */}
        <Link
          to="/concursos/ganadores"
          className={`group flex flex-wrap items-center gap-4 rounded-2xl border p-5 mb-10 transition-all ${
            isDark
              ? 'bg-stone-900 border-stone-800 hover:border-amber-500/40'
              : 'bg-white border-stone-200 hover:border-amber-600/40'
          }`}
        >
          <span className={`p-3 rounded-xl ${isDark ? 'bg-amber-950/50 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
            <Trophy className="w-6 h-6" />
          </span>
          <span className="flex-1 min-w-[200px]">
            <span className={`block font-serif font-bold text-lg ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
              Ganadores de ediciones anteriores
            </span>
            <span className={`block text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              El podio de cada edición cerrada, con las mejores historias para leer completas.
            </span>
          </span>
          <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
            isDark ? 'text-amber-400' : 'text-brand-700'
          }`} />
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contests.map((contest) => {
            const published = publishedByContest[contest.id] || 0;
            const isComingSoon = contest.status === 'proximamente';

            return (
              <Link
                key={contest.id}
                to={`/concursos/${contest.slug}`}
                className={`group flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:shadow-amber-900/5 ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 hover:border-amber-500/40'
                    : 'bg-white border-stone-200 hover:border-amber-600/40'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    statusClasses(contest.status, isDark)
                  }`}>
                    {CONTEST_STATUS_META[contest.status]?.label || contest.status}
                  </span>
                  {contest.edition && (
                    <span className={`text-xs font-semibold tabular-nums ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                      {`Edición ${contest.edition}`}
                    </span>
                  )}
                </div>

                <h2 className={`font-serif font-bold text-xl sm:text-2xl leading-snug mb-2 ${
                  isDark ? 'text-stone-100' : 'text-stone-900'
                }`}>
                  {contest.name}
                </h2>

                <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  {contest.summary}
                </p>

                <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-auto pt-4 border-t ${
                  isDark ? 'border-stone-800 text-stone-500' : 'border-stone-200 text-stone-500'
                }`}>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{contest.audience}</span>
                  </span>

                  {/* Icono y texto se cambian juntos, como un solo bloque: si se
                      intercambian por separado React puede quedarse sin el nodo
                      hermano de referencia al montar el nuevo icono. */}
                  <span className="inline-flex items-center gap-1.5">
                    {isComingSoon ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Convocatoria por abrir</span>
                      </>
                    ) : loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Contando…</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{`${published} ${published === 1 ? 'cuento publicado' : 'cuentos publicados'}`}</span>
                      </>
                    )}
                  </span>

                  <span className={`ml-auto inline-flex items-center gap-1 font-semibold transition-transform group-hover:translate-x-0.5 ${
                    isDark ? 'text-amber-400' : 'text-brand-700'
                  }`}>
                    <span>{isComingSoon ? 'Ver detalles' : 'Ver cuentos'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
