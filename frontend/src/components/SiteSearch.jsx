import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Loader2, Search, X } from 'lucide-react';
import { searchContent } from '../services/api';
import { Highlighted } from '../utils/searchHighlight';
import { MIN_QUERY_LENGTH, useHighlightTerms } from '../utils/searchText';
import { TYPE_BADGE, TYPE_LABEL } from '../utils/searchTypes';

const DEBOUNCE_MS = 350;

// Cuántos resultados se ven de cada grupo antes de pedir el resto. Tres dejan
// claro qué hay en el grupo sin que un tipo con muchas coincidencias empuje a
// los demás fuera de la pantalla.
const PREVIEW_PER_GROUP = 3;

const RECENT_KEY = 'librepalabras:busquedas-recientes';
const MAX_RECENT = 5;

/** Sitios a los que ir cuando no hay nada escrito o la búsqueda no encuentra nada. */
const SHORTCUTS = [
  { label: 'Biblioteca', url: '/stories' },
  { label: 'Autores', url: '/authors' },
  { label: 'Columnas', url: '/columnas' },
  { label: 'Ganadores', url: '/concursos/ganadores' },
  { label: 'Poliversia', url: '/poleversia' },
];

// Constante y no un `[]` nuevo en cada render: así el arreglo vacío no cuenta
// como un cambio de resultados para React.
const NO_RESULTS = [];
const NO_COUNTS = {};

const EMPTY_OUTCOME = {
  term: '',
  status: 'idle',
  results: NO_RESULTS,
  counts: NO_COUNTS,
  total: 0,
  approximate: false,
};

// El destino lo arma el backend con una plantilla fija, pero se vuelve a
// comprobar antes de navegar: una ruta interna empieza por "/" y no por "//",
// que el navegador entendería como otro dominio. Es barato y cierra la puerta a
// que un cambio futuro en el servidor convierta un resultado en un redirector.
function isInternalPath(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

function readRecent() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    if (!Array.isArray(stored)) return [];

    return stored.filter((item) => typeof item === 'string' && item.trim()).slice(0, MAX_RECENT);
  } catch {
    // Modo privado o almacenamiento lleno: el buscador funciona igual sin historial.
    return [];
  }
}

function writeRecent(list) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Ídem: no poder guardar el historial no debe romper la búsqueda.
  }
}

export default function SiteSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [typeFilter, setTypeFilter] = useState('todos');
  const [expandedTypes, setExpandedTypes] = useState(() => new Set());
  const [recent, setRecent] = useState(readRecent);

  /**
   * La respuesta se guarda junto al texto que la pidió. Ese `term` es lo que
   * distingue "no hay resultados" de "todavía estoy buscando": sin él, al
   * escribir una letra más se vería un "nada coincide" que en realidad es la
   * respuesta de la búsqueda anterior.
   */
  const [outcome, setOutcome] = useState(EMPTY_OUTCOME);

  const term = query.trim();
  const isTooShort = term.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    if (isTooShort) return undefined;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await searchContent(term, { signal: controller.signal });

        setOutcome({
          term,
          status: 'done',
          results: Array.isArray(response.results) ? response.results : NO_RESULTS,
          counts: response.counts && typeof response.counts === 'object' ? response.counts : NO_COUNTS,
          total: Number.isFinite(response.total) ? response.total : 0,
          approximate: Boolean(response.approximate),
        });
      } catch (error) {
        // Cancelar es lo normal aquí: significa que ya se escribió otra letra.
        if (error?.name === 'AbortError') return;

        setOutcome({ ...EMPTY_OUTCOME, term, status: 'error' });
      }
    }, DEBOUNCE_MS);

    // Al cambiar el texto se anula tanto la espera como la petición en curso.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, isTooShort]);

  // Mientras la respuesta no corresponda a lo que hay escrito, se está buscando.
  const isSearching = !isTooShort && outcome.term !== term;
  const settled = !isTooShort && !isSearching;
  const results = settled ? outcome.results : NO_RESULTS;
  const counts = settled ? outcome.counts : NO_COUNTS;
  const total = settled ? outcome.total : 0;

  /** Los términos tal como los entiende el servidor, para resaltarlos igual. */
  const highlightTerms = useHighlightTerms(term);

  /**
   * Los resultados repartidos en grupos, en el orden en que aparece el primero
   * de cada tipo: así el grupo más relevante encabeza la lista en vez de un
   * orden fijo que ignoraría la búsqueda.
   */
  const groups = useMemo(() => {
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
        // La cuenta del servidor incluye las que no cupieron en la respuesta.
        total: counts[type] ?? items.length,
      };
    });
  }, [results, counts]);

  const visibleGroups = useMemo(() => {
    const shown = typeFilter === 'todos'
      ? groups
      : groups.filter((group) => group.type === typeFilter);

    return shown.map((group) => {
      // Filtrar por un tipo es pedir ese grupo entero: no tiene sentido volver
      // a recortarlo a tres cuando el visitante acaba de decir que quiere ese.
      const openAll = typeFilter !== 'todos' || expandedTypes.has(group.type);

      return {
        ...group,
        visible: openAll ? group.items : group.items.slice(0, PREVIEW_PER_GROUP),
        canExpand: !openAll && group.items.length > PREVIEW_PER_GROUP,
        // El servidor recorta por tipo; si aún hay más, se dice en vez de
        // dejar creer que la lista está completa.
        truncated: openAll && group.total > group.items.length,
      };
    });
  }, [groups, typeFilter, expandedTypes]);

  /**
   * La lista plana de lo que se puede recorrer con las flechas. Incluye los
   * botones «ver más»: al llegar al final de un grupo, Enter lo despliega.
   */
  const navigable = useMemo(() => {
    const items = [];

    for (const group of visibleGroups) {
      group.visible.forEach((result) => items.push({ kind: 'result', result }));
      if (group.canExpand) items.push({ kind: 'more', type: group.type, group });
    }

    return items;
  }, [visibleGroups]);

  // Cerrar al pulsar fuera. Sin esto el panel se queda abierto tapando la
  // portada mientras se navega con el ratón.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const rememberSearch = useCallback((value) => {
    const clean = value.trim();
    if (clean.length < MIN_QUERY_LENGTH) return;

    setRecent((previous) => {
      const next = [clean, ...previous.filter((item) => item.toLowerCase() !== clean.toLowerCase())]
        .slice(0, MAX_RECENT);

      writeRecent(next);
      return next;
    });
  }, []);

  const goTo = useCallback((result) => {
    if (!isInternalPath(result?.url)) return;

    rememberSearch(term);
    setIsOpen(false);
    setQuery('');
    navigate(result.url);
  }, [navigate, rememberSearch, term]);

  const expandType = useCallback((type) => {
    setExpandedTypes((previous) => new Set(previous).add(type));
  }, []);

  /**
   * Escribir siempre deshace la selección: el resultado que estaba resaltado
   * pertenece a la búsqueda anterior, y dejar el índice puesto haría que Enter
   * abriera algo distinto de lo que se está mirando. Por lo mismo se sueltan el
   * filtro y los grupos abiertos, que eran de la búsqueda anterior.
   */
  const changeQuery = (value) => {
    setQuery(value);
    setHighlighted(-1);
    setTypeFilter('todos');
    setExpandedTypes(new Set());
    setIsOpen(true);
  };

  const clear = () => {
    changeQuery('');
    inputRef.current?.focus();
  };

  const activate = (item) => {
    if (!item) return;

    if (item.kind === 'more') {
      expandType(item.type);
      return;
    }

    goTo(item.result);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (navigable.length === 0) return;

      event.preventDefault();
      setIsOpen(true);
      setHighlighted((current) => {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        return (current + step + navigable.length) % navigable.length;
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      // Sin nada resaltado se abre el primer resultado: es lo que espera quien
      // escribe y pulsa Enter sin tocar las flechas.
      activate(navigable[highlighted] ?? navigable[0]);
    }
  };

  const showPanel = isOpen;
  const showSuggestions = isTooShort;
  const activeId = highlighted >= 0 ? `${listId}-${highlighted}` : undefined;

  // Índice global dentro de `navigable`, que avanza mientras se pintan los
  // grupos: es el que enlaza el resaltado del teclado con cada fila.
  let cursor = -1;

  return (
    <div ref={containerRef} className="relative max-w-xl mx-auto mb-10">
      <div className="relative">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-300/80 pointer-events-none"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label="Buscar obras, columnas, autores y ediciones"
          placeholder="Busca una obra, una columna, un autor…"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-14 pr-12 py-4 rounded-full bg-stone-950/60 backdrop-blur-md border border-amber-500/30 text-stone-100 placeholder:text-stone-400 shadow-2xl shadow-amber-900/20 outline-none transition-colors focus:border-amber-400/70 focus:bg-stone-950/80"
        />

        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center">
          {isSearching && (
            <Loader2 className="w-4 h-4 text-amber-300/80 animate-spin" aria-hidden="true" />
          )}

          {!isSearching && query && (
            <button
              type="button"
              onClick={clear}
              aria-label="Borrar la búsqueda"
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Quien usa lector de pantalla no ve el panel: se le anuncia el recuento. */}
      <p className="sr-only" role="status" aria-live="polite">
        {settled
          ? total > 0
            ? `${total} resultados para ${term}`
            : `Sin resultados para ${term}`
          : ''}
      </p>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-3 z-30 rounded-2xl border border-stone-700/70 bg-stone-950/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden text-left">
          {showSuggestions ? (
            <div className="p-5 space-y-5">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Búsquedas recientes
                    </p>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setRecent([]);
                        writeRecent([]);
                      }}
                      className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors"
                    >
                      Borrar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recent.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          changeQuery(item);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-stone-900 border border-stone-700/70 text-stone-300 hover:text-stone-100 hover:border-stone-500 transition-colors"
                      >
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Ir directamente a
                </p>
                <div className="flex flex-wrap gap-2">
                  {SHORTCUTS.map((shortcut) => (
                    <button
                      key={shortcut.url}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setIsOpen(false);
                        navigate(shortcut.url);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs bg-amber-500/10 border border-amber-500/30 text-amber-200 hover:bg-amber-500/20 transition-colors"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {!isSearching && outcome.status === 'error' && (
                <p className="px-5 py-4 text-sm text-stone-400">
                  No se pudo buscar ahora mismo. Intenta de nuevo en un momento.
                </p>
              )}

              {!isSearching && outcome.status === 'done' && results.length === 0 && (
                <div className="px-5 py-4">
                  <p className="text-sm text-stone-400">
                    Nada coincide con «{term}», ni siquiera de forma aproximada.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {SHORTCUTS.map((shortcut) => (
                      <button
                        key={shortcut.url}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setIsOpen(false);
                          navigate(shortcut.url);
                        }}
                        className="px-3 py-1.5 rounded-full text-xs bg-stone-900 border border-stone-700/70 text-stone-300 hover:text-stone-100 hover:border-stone-500 transition-colors"
                      >
                        {shortcut.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 && (
                <>
                  {outcome.approximate && (
                    <p className="px-5 pt-4 text-xs text-amber-200/80">
                      {`Nada coincide exactamente con «${term}». Esto es lo más parecido:`}
                    </p>
                  )}

                  {/* Filtro por tipo: la vía rápida a "solo autores" sin salir
                      del panel. Solo aparece si hay más de un tipo que filtrar. */}
                  {groups.length > 1 && (
                    <div className="flex flex-wrap gap-2 px-5 pt-4 pb-1">
                      {[{ type: 'todos', label: 'Todo', total }, ...groups].map((chip) => (
                        <button
                          key={chip.type}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setTypeFilter(chip.type);
                            setHighlighted(-1);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            typeFilter === chip.type
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                              : 'bg-stone-900 border-stone-700/70 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {chip.label}
                          <span className="ml-1.5 opacity-60 tabular-nums">{chip.total}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <ul id={listId} role="listbox" aria-label="Resultados" className="max-h-96 overflow-y-auto py-2">
                    {visibleGroups.map((group) => (
                      <li key={group.type} role="group" aria-label={group.label}>
                        <p className="px-5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          {group.label}
                          <span className="ml-1.5 text-stone-600 tabular-nums">{group.total}</span>
                        </p>

                        <ul role="presentation">
                          {group.visible.map((result) => {
                            cursor += 1;
                            const index = cursor;

                            return (
                              <li
                                key={result.id}
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === highlighted}
                              >
                                <button
                                  type="button"
                                  // `onMouseDown` en lugar de `onClick`: el clic normal llega
                                  // después de que el input pierda el foco, y para entonces el
                                  // panel ya se habría cerrado.
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    goTo(result);
                                  }}
                                  onMouseEnter={() => setHighlighted(index)}
                                  className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${
                                    index === highlighted ? 'bg-stone-800/80' : 'hover:bg-stone-900'
                                  }`}
                                >
                                  {result.image ? (
                                    <img
                                      src={result.image}
                                      alt=""
                                      loading="lazy"
                                      className="w-10 h-12 object-cover rounded-md flex-shrink-0"
                                    />
                                  ) : (
                                    <span className="w-10 h-12 rounded-md bg-stone-800 flex-shrink-0" aria-hidden="true" />
                                  )}

                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                      <span className="truncate font-medium text-stone-100">
                                        <Highlighted text={result.title} terms={highlightTerms} />
                                      </span>
                                      <span
                                        className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                                          TYPE_BADGE[result.type] || 'bg-stone-500/15 text-stone-300 border-stone-500/30'
                                        }`}
                                      >
                                        {result.label}
                                      </span>
                                    </span>

                                    {(result.author || result.subtitle) && (
                                      <span className="block truncate text-xs text-stone-400 mt-0.5">
                                        {result.author && (
                                          <span className="text-stone-300">
                                            <Highlighted text={result.author} terms={highlightTerms} />
                                          </span>
                                        )}
                                        {result.author && result.subtitle && ' · '}
                                        {result.subtitle && (
                                          <Highlighted text={result.subtitle} terms={highlightTerms} />
                                        )}
                                      </span>
                                    )}
                                  </span>
                                </button>
                              </li>
                            );
                          })}

                          {group.canExpand && (() => {
                            cursor += 1;
                            const index = cursor;

                            return (
                              <li
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === highlighted}
                              >
                                <button
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    expandType(group.type);
                                  }}
                                  onMouseEnter={() => setHighlighted(index)}
                                  className={`w-full px-5 py-2 text-left text-xs font-semibold text-amber-300/90 transition-colors ${
                                    index === highlighted ? 'bg-stone-800/80' : 'hover:bg-stone-900'
                                  }`}
                                >
                                  {`Ver ${group.items.length - PREVIEW_PER_GROUP} más en ${group.label}`}
                                </button>
                              </li>
                            );
                          })()}
                        </ul>

                        {group.truncated && (
                          <p className="px-5 py-1.5 text-[11px] text-stone-500">
                            {`Se muestran los ${group.items.length} más relevantes de ${group.total}. `}
                            <button
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                rememberSearch(term);
                                setIsOpen(false);
                                navigate(`/buscar?q=${encodeURIComponent(term)}&tipo=${encodeURIComponent(group.type)}`);
                              }}
                              className="text-amber-300/90 hover:underline"
                            >
                              {`Ver los ${group.total} en ${group.label}`}
                            </button>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-stone-800/80 px-5 py-3">
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        rememberSearch(term);
                        setIsOpen(false);
                        navigate(`/buscar?q=${encodeURIComponent(term)}`);
                      }}
                      className="text-xs font-semibold text-amber-300/90 hover:underline"
                    >
                      {`Ver todos los resultados para «${term}» →`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
