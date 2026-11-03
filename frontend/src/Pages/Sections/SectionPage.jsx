import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FeaturedAuthors from '../../components/FeaturedAuthors';
import SectionWorkArticle from '../../components/SectionWorkArticle';
import { getSectionWork, getSectionWorks } from '../../services/api';
import { canPublishIn, newWorkPath } from '../../config/sections';

const WORKS_PER_PAGE = 12;

/**
 * Página pública de una sección especial, con el mismo lenguaje que la
 * biblioteca de literatura: encabezado serif, filtros en píldoras, tarjetas con
 * portada, paginación y los autores a la derecha. Una sola para las dos
 * secciones; lo que cambia viene de `section` (config/sections.js).
 */
export default function SectionPage({ section }) {
  const { isDark } = useContext(ThemeContext);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  // Cada resultado lleva la clave con la que se pidió: mientras no coincida con
  // la actual, la pantalla está cargando. Así no hace falta apagar y encender
  // un indicador a mano dentro de los efectos.
  const [list, setList] = useState({ key: null, works: [], error: '' });
  const [reader, setReader] = useState({ id: null, work: null, error: '' });
  const openedId = searchParams.get('obra');
  const listKey = `${section.value}:${kind}`;

  useEffect(() => {
    let cancelled = false;

    getSectionWorks(section.value, { kind, limit: 100 })
      .then((response) => {
        if (!cancelled) setList({ key: listKey, works: response.works || [], error: '' });
      })
      .catch((err) => {
        if (!cancelled) setList({ key: listKey, works: [], error: err.message || 'No se pudo cargar la sección' });
      });

    return () => { cancelled = true; };
  }, [section.value, kind, listKey]);

  // La obra se abre a partir de `?obra=`: así la tarjeta, un enlace compartido
  // y un resultado del buscador entran por el mismo camino.
  useEffect(() => {
    if (!openedId) return undefined;

    let cancelled = false;

    getSectionWork(section.value, openedId)
      .then((response) => {
        if (!cancelled) setReader({ id: openedId, work: response.work, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setReader({ id: openedId, work: null, error: err.message });
      });

    return () => { cancelled = true; };
  }, [section.value, openedId]);

  const loading = list.key !== listKey;
  const { works, error } = list;
  const readerReady = reader.id === openedId;

  const totalPages = Math.max(1, Math.ceil(works.length / WORKS_PER_PAGE));
  const pageWorks = useMemo(
    () => works.slice((page - 1) * WORKS_PER_PAGE, page * WORKS_PER_PAGE),
    [works, page],
  );

  const kindOf = (value) => section.kinds.find((item) => item.value === value);
  const canPublish = canPublishIn(section, user?.role);

  const changeKind = (value) => {
    setKind(value);
    setPage(1);
  };

  const closeWork = () => setSearchParams({});

  const chip = (active) => `px-3 py-1.5 rounded-full text-sm font-serif transition-colors ${
    active
      ? isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-stone-900 text-stone-50'
      : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
  }`;

  const pagerButton = (disabled) => `px-4 py-2 rounded-md text-sm font-serif transition-all ${
    disabled
      ? isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
  }`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-stone-900'
    }`}>
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 py-8 sm:py-12">
        {openedId ? (
          <SectionWorkArticle
            section={section}
            work={readerReady ? reader.work : null}
            kind={kindOf(reader.work?.kind)}
            loading={!readerReady}
            error={readerReady ? reader.error : ''}
            isDark={isDark}
            onBack={closeWork}
          />
        ) : (
          <div className="max-w-7xl mx-auto">
            <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 text-center sm:text-left">
              <div>
                <h1 className={`text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-3 ${isDark ? 'text-amber-100' : 'text-stone-900'}`}>
                  {section.label}
                </h1>
                <p className={`text-base sm:text-lg max-w-2xl font-serif italic ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                  {section.description}
                </p>
              </div>

              {canPublish && (
                <Link
                  to={newWorkPath(section)}
                  className={`inline-flex items-center justify-center gap-2 shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    isDark ? 'bg-amber-500 text-stone-950 hover:bg-amber-400' : 'bg-stone-900 text-stone-50 hover:bg-stone-800'
                  }`}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Publicar
                </Link>
              )}
            </header>

            <div className={`mb-10 pb-5 border-b flex flex-wrap items-center gap-2 ${isDark ? 'border-slate-800' : 'border-stone-200'}`}>
              <span className={`text-xs font-sans font-semibold uppercase tracking-wider mr-1 ${isDark ? 'text-slate-500' : 'text-stone-500'}`}>
                Tipo
              </span>
              <button type="button" aria-pressed={kind === ''} className={chip(kind === '')} onClick={() => changeKind('')}>
                Todos
              </button>
              {section.kinds.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={kind === item.value}
                  className={chip(kind === item.value)}
                  onClick={() => changeKind(item.value)}
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              <div className="lg:col-span-9 min-w-0">
                {loading && (
                  <p className={`py-20 text-center font-serif animate-pulse ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                    Cargando…
                  </p>
                )}

                {!loading && error && <p className="py-20 text-center font-serif text-rose-500">{error}</p>}

                {!loading && !error && works.length === 0 && (
                  <div className={`py-20 text-center ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                    <p className="font-serif text-xl">
                      {kind ? 'Todavía no hay aportes de este tipo.' : section.emptyText}
                    </p>
                    {kind && (
                      <button
                        type="button"
                        onClick={() => changeKind('')}
                        className={`mt-2 text-sm font-semibold underline ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-brand-700 hover:text-brand-800'}`}
                      >
                        Ver todo
                      </button>
                    )}
                  </div>
                )}

                {!loading && !error && works.length > 0 && (
                  <div className={`grid gap-x-5 gap-y-8 ${section.card.grid}`}>
                    {pageWorks.map((work) => {
                      const workKind = kindOf(work.kind);

                      return (
                        <button
                          key={work.id}
                          type="button"
                          onClick={() => setSearchParams({ obra: work.id })}
                          className="group text-left flex flex-col transition-transform duration-300 hover:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-amber-500 rounded-lg"
                        >
                          <div className={`relative ${section.card.aspect} w-full rounded-lg overflow-hidden shadow-md group-hover:shadow-2xl transition-all duration-300 border ${
                            isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-stone-100'
                          }`}>
                            {work.cover ? (
                              <img
                                src={work.cover}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              // Portada tipográfica para los textos sin imagen.
                              <div className={`w-full h-full p-4 flex flex-col justify-between ${
                                isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-amber-100/50 to-stone-200'
                              }`}>
                                <span className="text-2xl" aria-hidden="true">{workKind?.emoji}</span>
                                <h3 className={`font-serif text-sm font-bold line-clamp-4 leading-snug ${isDark ? 'text-slate-200' : 'text-stone-800'}`}>
                                  {work.title}
                                </h3>
                              </div>
                            )}

                            {work.excerpt && (
                              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end text-white">
                                <span className="text-[10px] uppercase tracking-wider text-amber-300 font-sans mb-1">
                                  {workKind?.label}
                                </span>
                                <p className="text-[11px] text-slate-200 line-clamp-5">{work.excerpt}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex flex-col gap-1">
                            <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              {workKind?.emoji} {workKind?.label}
                            </span>
                            <h3 className={`font-serif font-semibold text-sm line-clamp-2 group-hover:text-amber-600 transition-colors ${
                              isDark ? 'text-slate-200' : 'text-stone-900'
                            }`}>
                              {work.title}
                            </h3>
                            <p className={`text-xs font-serif italic ${isDark ? 'text-slate-400' : 'text-stone-500'}`}>
                              {work.author || 'Anónimo'}
                              {work.childAge ? `, ${work.childAge} años` : ''}
                              {work.municipality ? ` · ${work.municipality}` : ''}
                            </p>
                            <span className={`flex items-center gap-1 text-[11px] tabular-nums mt-1 ${isDark ? 'text-slate-500' : 'text-stone-400'}`}>
                              <Eye className="w-3 h-3" aria-hidden="true" />
                              {work.views || 0}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!loading && totalPages > 1 && (
                  <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginación">
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={pagerButton(page === 1)}
                    >
                      Anterior
                    </button>
                    <span className={`px-2 sm:px-4 py-2 text-sm font-serif ${isDark ? 'text-slate-400' : 'text-stone-600'}`}>
                      Página {page} de {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={pagerButton(page === totalPages)}
                    >
                      Siguiente
                    </button>
                  </nav>
                )}
              </div>

              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-24">
                  <FeaturedAuthors
                    isDark={isDark}
                    title={section.authors.title}
                    noteTitle={section.authors.noteTitle}
                    note={section.authors.note}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
