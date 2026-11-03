import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

/**
 * Secciones de comunidad de la barra superior. Agruparlas en un menú evita que
 * la fila de enlaces crezca con cada sección nueva y quede apretada.
 */
const COMMUNITY_LINKS = [
  { to: '/poleversia', label: 'Revista Poleversia' },
  { to: '/grupo-focal', label: 'Grupo Focal' },
  { to: '/los-ninos-cuentan', label: 'Los niños cuentan' },
  { to: '/palabras-sin-duenos', label: 'Palabras sin dueños' },
];

const LABEL = 'Comunidad';

/**
 * Escritorio: se abre al pasar por encima, al pulsar el botón o al enfocarlo con
 * el teclado, y se cierra con Escape o al hacer clic fuera. A diferencia de los
 * menús de géneros, "Comunidad" no es una página, así que el título es un
 * botón y no un enlace.
 */
export default function CommunityNavMenu({ isDark }) {
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
      if (event.key === 'Escape') setIsOpen(false);
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
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={close}
    >
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        onFocus={() => setIsOpen(true)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center gap-1 text-xs lg:text-sm font-medium transition-colors ${
          isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700'
        }`}
      >
        {LABEL}
        <ChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        // `pt-3` y no `mt-3`: el hueco forma parte del contenedor, así que el
        // puntero no sale de él al bajar al panel y el menú no se cierra.
        <div className="absolute left-0 top-full pt-3 z-50 animate-modal-panel">
          <ul
            className={`min-w-56 rounded-xl border shadow-xl p-2 ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            {COMMUNITY_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={close}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** El mismo menú dentro del panel móvil, donde no hay puntero: se pliega con un botón. */
export function CommunityNavAccordion({ isDark, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 text-sm font-medium transition-colors ${
          isDark ? 'text-gray-300 hover:text-white' : 'text-brand-700 hover:text-gray-900'
        }`}
      >
        {LABEL}
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={`mt-3 ml-3 pl-3 border-l space-y-2.5 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
          {COMMUNITY_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className={`block text-sm transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
