import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import { searchContent } from '../services/api';



const DEBOUNCE_MS = 350;

// El mismo mínimo que aplica el servidor. Comprobarlo aquí solo evita el viaje.
const MIN_QUERY_LENGTH = 2;

const TYPE_BADGE = {
  obra: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  columna: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  autor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  poliversia: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  concurso: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

// Constante y no un `[]` nuevo en cada render: así el arreglo vacío no cuenta
// como un cambio de resultados para React.
const NO_RESULTS = [];

// El destino lo arma el backend con una plantilla fija, pero se vuelve a
// comprobar antes de navegar: una ruta interna empieza por "/" y no por "//",
// que el navegador entendería como otro dominio. Es barato y cierra la puerta a
// que un cambio futuro en el servidor convierta un resultado en un redirector.
function isInternalPath(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

export default function SiteSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  /**
   * La respuesta se guarda junto al texto que la pidió. Ese `term` es lo que
   * distingue "no hay resultados" de "todavía estoy buscando": sin él, al
   * escribir una letra más se vería un "nada coincide" que en realidad es la
   * respuesta de la búsqueda anterior.
   */
  const [outcome, setOutcome] = useState({ term: '', status: 'idle', results: NO_RESULTS });

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
        });
      } catch (error) {
        // Cancelar es lo normal aquí: significa que ya se escribió otra letra.
        if (error?.name === 'AbortError') return;

        setOutcome({ term, status: 'error', results: NO_RESULTS });
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
  const results = isTooShort || isSearching ? NO_RESULTS : outcome.results;

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

  const goTo = useCallback((result) => {
    if (!isInternalPath(result?.url)) return;

    setIsOpen(false);
    setQuery('');
    navigate(result.url);
  }, [navigate]);

  /**
   * Escribir siempre deshace la selección: el resultado que estaba resaltado
   * pertenece a la búsqueda anterior, y dejar el índice puesto haría que Enter
   * abriera algo distinto de lo que se está mirando.
   */
  const changeQuery = (value) => {
    setQuery(value);
    setHighlighted(-1);
    setIsOpen(true);
  };

  const clear = () => {
    changeQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (results.length === 0) return;

      event.preventDefault();
      setIsOpen(true);
      setHighlighted((current) => {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        return (current + step + results.length) % results.length;
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      // Sin nada resaltado se abre el primer resultado: es lo que espera quien
      // escribe y pulsa Enter sin tocar las flechas.
      goTo(results[highlighted] ?? results[0]);
    }
  };

  const showPanel = isOpen && !isTooShort;
  const activeId = highlighted >= 0 ? `${listId}-${highlighted}` : undefined;

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

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-3 z-30 rounded-2xl border border-stone-700/70 bg-stone-950/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden text-left">
          {!isSearching && outcome.status === 'error' && (
            <p className="px-5 py-4 text-sm text-stone-400">
              No se pudo buscar ahora mismo. Intenta de nuevo en un momento.
            </p>
          )}

          {!isSearching && outcome.status === 'done' && results.length === 0 && (
            <p className="px-5 py-4 text-sm text-stone-400">
              Nada coincide con «{term}».
            </p>
          )}

          {results.length > 0 && (
            <ul id={listId} role="listbox" aria-label="Resultados" className="max-h-96 overflow-y-auto py-2">
              {results.map((result, index) => (
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
                        <span className="truncate font-medium text-stone-100">{result.title}</span>
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
                          {result.author && <span className="text-stone-300">{result.author}</span>}
                          {result.author && result.subtitle && ' · '}
                          {result.subtitle}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
