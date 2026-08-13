import { useContext, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import SocialIcon from './SocialIcon';
import { platformLabel } from '../utils/socialLinks';

/**
 * La ficha completa de un autor.
 *
 * En la tarjeta del catálogo la biografía va recortada a tres líneas: son
 * ocho tarjetas en rejilla y no pueden crecer cada una a su aire. Aquí se lee
 * entera y con sus párrafos, que es para lo que se escribió.
 *
 * Sigue el mismo comportamiento que `ConfirmDialog`, que es el diálogo que ya
 * usa la aplicación: Escape cierra, el clic en el fondo cierra, el tabulador no
 * se escapa a la página de detrás y el foco vuelve al botón que lo abrió.
 */
export default function AuthorDetailModal({ author, onClose }) {
  const { isDark } = useContext(ThemeContext);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      // Aquí sí hay enlaces además de botones: la lista de redes es navegable
      // con el tabulador y tiene que entrar en el ciclo.
      const focusables = panelRef.current?.querySelectorAll('button, a[href]');
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  if (!author) return null;

  const fallbackPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=random&size=300`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="author-modal-name"
        className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl animate-modal-panel ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {/* Cabecera fija: el retrato y el nombre no se van al desplazar una
            biografía larga. */}
        <div className={`relative shrink-0 px-6 pt-7 pb-5 border-b text-center ${
          isDark ? 'border-gray-800' : 'border-gray-100'
        }`}>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isDark ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <X size={18} />
          </button>

          <img
            src={author.photoURL || fallbackPhoto}
            alt={`Foto de perfil de ${author.name}`}
            className={`w-28 h-28 rounded-full object-cover mx-auto mb-4 ring-4 shadow-md ${
              isDark ? 'ring-gray-800' : 'ring-gray-100'
            }`}
          />

          <h2
            id="author-modal-name"
            className={`text-xl font-bold font-serif ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
          >
            {author.name}
          </h2>

          {author.role && (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
              {author.role}
            </p>
          )}

          {author.links?.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {author.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={platformLabel(link.url, link.label)}
                  aria-label={`${platformLabel(link.url, link.label)} de ${author.name}`}
                  className={`p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    isDark
                      ? 'text-gray-400 hover:text-amber-400 hover:bg-gray-800'
                      : 'text-gray-500 hover:text-amber-700 hover:bg-gray-100'
                  }`}
                >
                  <SocialIcon url={link.url} size={17} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* La biografía es lo único que se desplaza. `whitespace-pre-line`
            mantiene los párrafos tal como los escribió el administrador. */}
        <div className="overflow-y-auto px-6 py-5">
          <p className={`text-sm leading-relaxed whitespace-pre-line ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {author.description || 'Este autor todavía no tiene biografía.'}
          </p>
        </div>
      </div>
    </div>
  );
}
