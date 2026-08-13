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
        className={`w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-modal-panel ${
          isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
        }`}
      >
        {/* Cabecera fija: el retrato y el nombre no se van al desplazar una
            biografía larga. La banda de color le da al retrato un fondo sobre
            el que apoyarse; antes flotaba sobre el blanco y la ficha se veía
            desangelada. */}
        <div className="relative shrink-0">
          <div
            aria-hidden="true"
            className={`h-24 bg-gradient-to-br ${
              isDark ? 'from-brand-950 via-stone-900 to-brand-900' : 'from-brand-700 via-brand-600 to-brand-800'
            }`}
          />

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-white/80 bg-black/10 hover:bg-black/25 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X size={18} />
          </button>

          <div className={`px-6 pb-5 text-center border-b ${isDark ? 'border-stone-800' : 'border-stone-100'}`}>
            <img
              src={author.photoURL || fallbackPhoto}
              alt={`Foto de perfil de ${author.name}`}
              className={`w-28 h-28 rounded-full object-cover mx-auto -mt-14 mb-4 ring-4 shadow-lg ${
                isDark ? 'ring-stone-900' : 'ring-white'
              }`}
            />

            <h2
              id="author-modal-name"
              className={`text-2xl font-bold font-serif ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
            >
              {author.name}
            </h2>

            {author.role && (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-500/10 text-amber-700'
              }`}>
                {author.role}
              </span>
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
                    className={`p-2 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isDark
                        ? 'border-stone-800 text-stone-400 hover:text-amber-400 hover:border-stone-700'
                        : 'border-stone-200 text-stone-500 hover:text-amber-700 hover:border-stone-300'
                    }`}
                  >
                    <SocialIcon url={link.url} size={17} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* La biografía es lo único que se desplaza. `whitespace-pre-line`
            mantiene los párrafos tal como los escribió el administrador. */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6">
          <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`}>
            Semblanza
          </h3>

          {author.description ? (
            <p className={`text-sm leading-relaxed whitespace-pre-line ${
              isDark ? 'text-stone-300' : 'text-stone-700'
            }`}>
              {author.description}
            </p>
          ) : (
            <p className={`text-sm italic ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Este autor todavía no tiene semblanza.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
