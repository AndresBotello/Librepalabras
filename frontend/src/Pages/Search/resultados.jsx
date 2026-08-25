import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { searchContent } from '../../services/api';
import { Highlighted } from '../../utils/searchHighlight';
import { MIN_QUERY_LENGTH, useHighlightTerms } from '../../utils/searchText';
import { TYPE_BADGE, TYPE_LABEL } from '../../utils/searchTypes';

const DEBOUNCE_MS = 350;

/** Sitios a los que ir cuando no hay nada que buscar o la búsqueda no encuentra nada. */
const SHORTCUTS = [
  { label: 'Biblioteca', url: '/stories' },
  { label: 'Autores', url: '/authors' },
  { label: 'Columnas', url: '/columnas' },
  { label: 'Ganadores', url: '/concursos/ganadores' },
  { label: 'Poliversia', url: '/poleversia' },
];

const NO_RESULTS = [];
const NO_COUNTS = {};

// Mismo resguardo que en el desplegable: el destino lo arma el backend con una
// plantilla fija, pero se comprueba otra vez antes de enlazar. Barato y cierra
// la puerta a que un cambio futuro en el servidor cuele una redirección.
function isInternalPath(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

/**
 * Página de resultados: lo que hay detrás de "Ver todos los resultados" y de
 * "Ver los N en <tipo>" en el desplegable de la portada, para cuando lo que
 * coincide no cabe en un panel flotante.
 *
 * El estado que importa —la consulta y el tipo elegido— vive en la URL
 * (`?q=&tipo=`), no en un `useState` suelto: así el resultado se puede
 * compartir, y "atrás" en el navegador vuelve a la búsqueda anterior en vez de
 * sacar de la página.
 */
export default function SearchResults() {
  const { isDark } = useContext(ThemeContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const typeFilter = searchParams.get('tipo') || '';
  const term = q.trim();
  const isTooShort = term.length < MIN_QUERY_LENGTH;

  const [inputValue, setInputValue] = useState(q);

  // Si se llega con otra consulta (un enlace nuevo, "atrás" en el navegador),
  // el campo de texto tiene que reflejarla en vez de conservar lo que hubiera.
  // Se ajusta durante el render, no en un efecto: es el mismo `q` el que ya
  // distingue "cambió por fuera" de "el usuario sigue escribiendo".
  const [syncedQuery, setSyncedQuery] = useState(q);
  if (q !== syncedQuery) {
    setSyncedQuery(q);
    setInputValue(q);
  }

  const [outcome, setOutcome] = useState({
    term: '',
    type: '',
    status: 'idle',
    results: NO_RESULTS,
    counts: NO_COUNTS,
    total: 0,
    approximate: false,
  });

  /*
   * Sin debounce aquí: la URL solo cambia después de que el campo de texto ya
   * esperó lo suyo (ver el efecto de más abajo), así que cuando `term` cambia
   * es porque ya toca buscar. El único cuidado es el de siempre — cancelar la
   * petición si `term` o `typeFilter` vuelven a cambiar antes de que responda.
   */
  useEffect(() => {
    if (isTooShort) return undefined;

    const controller = new AbortController();

    searchContent(term, { signal: controller.signal, type: typeFilter || undefined })
      .then((response) => {
        setOutcome({
          term,
          type: typeFilter,
          status: 'done',
          results: Array.isArray(response.results) ? response.results : NO_RESULTS,
          counts: response.counts && typeof response.counts === 'object' ? response.counts : NO_COUNTS,
          total: Number.isFinite(response.total) ? response.total : 0,
          approximate: Boolean(response.approximate),
        });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setOutcome({ term, type: typeFilter, status: 'error', results: NO_RESULTS, counts: NO_COUNTS, total: 0, approximate: false });
      });

    return () => controller.abort();
  }, [term, typeFilter, isTooShort]);

  const isSearching = !isTooShort && (outcome.term !== term || outcome.type !== typeFilter);
  const settled = !isTooShort && !isSearching;
  const results = settled ? outcome.results : NO_RESULTS;
  const counts = settled ? outcome.counts : NO_COUNTS;
  const total = settled ? outcome.total : 0;

  const highlightTerms = useHighlightTerms(term);

  // Agrupado solo cuando no hay un tipo elegido: con `tipo` en la URL la
  // respuesta ya es un solo grupo completo, así que no hay nada que repartir.
  const groups = useMemo(() => {
    if (typeFilter) return [];

    const order = [];
    const byType = new Map();

    for (const result of results) {
      if (!byType.has(result.type)) {
        byType.set(result.type, []);
        order.push(result.type);
      }
      byType.get(result.type).push(result);
    }

    return order.map((type) => {
      const items = byType.get(type);
      return {
        type,
        label: TYPE_LABEL[type] || type,
        items,
        total: counts[type] ?? items.length,
      };
    });
  }, [results, counts, typeFilter]);

  const goToQuery = (value) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value.trim()) next.set('q', value); else next.delete('q');
      // Una consulta nueva vuelve a mostrar todos los tipos: el filtro era de
      // la búsqueda anterior.
      next.delete('tipo');
      return next;
    }, { replace: true });
  };

  const openType = (type) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('tipo', type);
      return next;
    });
  };

  const clearType = () => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('tipo');
      return next;
    });
  };

  useEffect(() => {
    if (inputValue === q) return undefined;

    const timer = setTimeout(() => goToQuery(inputValue), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const pageBg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const cardBg = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const mutedText = isDark ? 'text-stone-400' : 'text-stone-600';

  return (
    <div className={`min-h-screen flex flex-col ${pageBg}`}>
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-12">
        <header className="mb-8">
          <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
            Buscar
          </span>
          <h1 className={`text-3xl sm:text-4xl font-serif font-bold mb-6 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Resultados de búsqueda
          </h1>

          <div className="relative max-w-xl">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${mutedText}`}
              aria-hidden="true"
            />
            <input
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Busca una obra, una columna, un autor…"
              aria-label="Buscar en todo el sitio"
              className={`w-full pl-11 pr-10 py-3 rounded-xl border text-sm outline-none transition-colors focus:ring-2 ${
                isDark
                  ? 'bg-stone-900 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:ring-amber-500/30 focus:border-amber-500'
                  : 'bg-white border-stone-300 text-stone-800 placeholder:text-stone-400 focus:ring-amber-600/20 focus:border-amber-600'
              }`}
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                aria-label="Borrar la búsqueda"
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${mutedText} hover:text-amber-500`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </header>

        {isTooShort ? (
          <p className={`text-sm ${mutedText}`}>
            {term.length === 0 ? 'Escribe algo para buscar.' : 'Escribe al menos dos letras para buscar.'}
          </p>
        ) : isSearching ? (
          <div className={`flex items-center gap-3 py-16 text-sm ${mutedText}`}>
            <Loader2 className="w-5 h-5 animate-spin" />
            Buscando…
          </div>
        ) : outcome.status === 'error' ? (
          <p className={`text-sm ${mutedText}`}>No se pudo buscar ahora mismo. Intenta de nuevo en un momento.</p>
        ) : total === 0 ? (
          <div>
            <p className={`text-sm mb-4 ${mutedText}`}>
              {`Nada coincide con «${term}», ni siquiera de forma aproximada.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {SHORTCUTS.map((shortcut) => (
                <Link
                  key={shortcut.url}
                  to={shortcut.url}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    isDark
                      ? 'bg-stone-900 border-stone-700 text-stone-300 hover:text-stone-100 hover:border-stone-500'
                      : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400'
                  }`}
                >
                  {shortcut.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {outcome.approximate && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {`Nada coincide exactamente con «${term}». Esto es lo más parecido:`}
              </p>
            )}

            {typeFilter ? (
              <section>
                <button
                  type="button"
                  onClick={clearType}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold mb-4 transition-colors ${
                    isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Todos los tipos
                </button>

                <h2 className={`text-sm font-bold mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  {TYPE_LABEL[typeFilter] || typeFilter}
                  <span className={`ml-2 font-normal ${mutedText}`}>{total}</span>
                </h2>

                <ResultGrid results={results} highlightTerms={highlightTerms} isDark={isDark} cardBg={cardBg} mutedText={mutedText} />
              </section>
            ) : (
              groups.map((group) => (
                <section key={group.type}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                    <h2 className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      {group.label}
                      <span className={`ml-2 font-normal ${mutedText}`}>{group.total}</span>
                    </h2>

                    {group.total > group.items.length && (
                      <button
                        type="button"
                        onClick={() => openType(group.type)}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        {`Ver los ${group.total} →`}
                      </button>
                    )}
                  </div>

                  <ResultGrid results={group.items} highlightTerms={highlightTerms} isDark={isDark} cardBg={cardBg} mutedText={mutedText} />
                </section>
              ))
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ResultGrid({ results, highlightTerms, isDark, cardBg, mutedText }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {results.map((result) => {
        const content = (
          <>
            {result.image ? (
              <img
                src={result.image}
                alt=""
                loading="lazy"
                className="w-14 h-16 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <span className={`w-14 h-16 rounded-md flex-shrink-0 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`} aria-hidden="true" />
            )}

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className={`truncate font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  <Highlighted text={result.title} terms={highlightTerms} />
                </span>
                <span
                  className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    TYPE_BADGE[result.type] || 'bg-stone-500/15 text-stone-500 border-stone-500/30'
                  }`}
                >
                  {result.label}
                </span>
              </span>

              {(result.author || result.subtitle) && (
                <span className={`block text-xs mt-1 ${mutedText}`}>
                  {result.author && (
                    <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>
                      <Highlighted text={result.author} terms={highlightTerms} />
                    </span>
                  )}
                  {result.author && result.subtitle && ' · '}
                  {result.subtitle && <Highlighted text={result.subtitle} terms={highlightTerms} />}
                </span>
              )}
            </span>
          </>
        );

        return isInternalPath(result.url) ? (
          <Link
            key={result.id}
            to={result.url}
            className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-colors ${cardBg} hover:border-amber-500/40`}
          >
            {content}
          </Link>
        ) : (
          <div key={result.id} className={`flex items-start gap-4 p-4 rounded-xl border ${cardBg}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
