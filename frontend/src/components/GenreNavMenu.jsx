import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import genresData from '../config/genres.json';
import { AllGenresIcon, GenreIcon } from '../config/genreIcons';

/**
 * Menú de categorías de la barra superior.
 *
 * Lo usan "Literatura" (la biblioteca de obras) y "Libros" (el catálogo en
 * venta): las dos secciones se filtran por el mismo catálogo de géneros y solo
 * cambian la ruta de destino, así que compartir el componente evita que una
 * acabe comportándose distinto de la otra.
 *
 * El título es un enlace normal —al pulsarlo se entra a la sección completa— y
 * el panel se abre al pasar por encima o al enfocarlo con el teclado. Elegir
 * categoría es un atajo, nunca un paso obligatorio.
 */

/** Enlace a una sección ya filtrada por categoría. */
export const genreLink = (basePath, value) => `${basePath}?genero=${encodeURIComponent(value)}`;

export default function GenreNavMenu({ label, basePath, allLabel, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    // Sin `relative` a propósito: el panel se ancla a la fila de enlaces de la
    // navbar (que sí lo lleva) para ocupar todo su ancho. El panel sigue siendo
    // hijo de este div, así que pasar el puntero por encima no dispara el
    // `onMouseLeave` y el menú no se cierra al ir a elegir categoría.
    <div
      ref={containerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={close}
    >
      <Link
        to={basePath}
        onFocus={() => setIsOpen(true)}
        onClick={close}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center gap-1 text-xs lg:text-sm font-medium transition-colors ${
          isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'
        }`}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Link>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full pt-3 animate-modal-panel">
          <div className={`rounded-xl border shadow-xl p-4 ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <Link
              to={basePath}
              onClick={close}
              className={`flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg text-sm font-semibold transition-colors ${
                isDark ? 'text-amber-400 hover:bg-gray-800' : 'text-brand-700 hover:bg-gray-100'
              }`}
            >
              <AllGenresIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {allLabel}
            </Link>

            {/* Tres columnas: al ocupar el panel toda la fila, con dos quedaban
                enlaces cortos perdidos en mucho blanco. */}
            <div className={`grid grid-cols-3 gap-x-6 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              {genresData.genres.map((genre) => (
                <Link
                  key={genre.value}
                  to={genreLink(basePath, genre.value)}
                  onClick={close}
                  title={genre.description}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isDark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <GenreIcon genre={genre.value} className="w-4 h-4 shrink-0 opacity-70" />
                  {genre.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * La misma lista dentro del menú móvil. Ahí no hay puntero, así que se pliega y
 * despliega con un botón en vez de abrirse al pasar por encima.
 */
export function GenreNavAccordion({ label, basePath, isDark, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Link
          to={basePath}
          onClick={onNavigate}
          className={`block text-sm font-medium transition-colors ${
            isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'
          }`}
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          aria-expanded={isOpen}
          aria-label={`Ver categorías de ${label}`}
          className={`p-1 rounded transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-brand-700'}`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className={`mt-3 ml-3 pl-3 border-l space-y-2.5 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
          {genresData.genres.map((genre) => (
            <Link
              key={genre.value}
              to={genreLink(basePath, genre.value)}
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className={`flex items-center gap-2.5 text-sm transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GenreIcon genre={genre.value} className="w-4 h-4 shrink-0 opacity-70" />
              {genre.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
