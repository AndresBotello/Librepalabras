import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Una sola vez por pestaña: `sessionStorage` sobrevive a navegar dentro del
// sitio y volver a la portada, pero se olvida al cerrar la pestaña o abrir una
// nueva, que es justo el límite que se pidió ("si me muevo dentro de ella y
// vuelvo al home no quiero que salga").
const SESSION_KEY = 'homePopupsShown';

// Cuánto hay que arrastrar, en píxeles, para que un gesto cuente como swipe en
// vez de un toque accidental.
const SWIPE_THRESHOLD = 50;

export default function HomeInvitationPopup({ popups = [], active, isDark }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const dragStartX = useRef(null);

  const close = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // No pasa nada si no se recuerda: en el peor caso, vuelve a salir en
      // esta misma pestaña la próxima vez que se visite la portada.
    }

    setVisible(false);
  };

  const goTo = (direction) => {
    setIndex((current) => {
      const next = current + direction;

      // Deslizar más allá del último cartel cierra la ventana, como pidió el
      // encargo ("al dar a un lado se quitarán").
      if (next < 0 || next >= popups.length) {
        close();
        return current;
      }

      return next;
    });
  };

  useEffect(() => {
    if (!active || popups.length === 0) return;

    let alreadyShown;

    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // Navegación privada o cuota llena: sin memoria de sesión, se muestra
      // igual antes que dejar la invitación sin efecto.
      alreadyShown = false;
    }

    // Lee `sessionStorage`, algo que solo existe fuera de React: por eso la
    // decisión se toma en un efecto y no calculando el estado inicial.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!alreadyShown) setVisible(true);
    // Solo debe decidirse al entrar a la portada, no cada vez que cambian las
    // imágenes (p. ej. si llegan tarde de la API tras el primer render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, popups.length > 0]);

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        goTo(1);
      } else if (event.key === 'ArrowLeft') {
        goTo(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, index]);

  if (!visible || popups.length === 0) {
    return null;
  }

  const handlePointerDown = (event) => {
    dragStartX.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    if (dragStartX.current === null) return;

    const delta = event.clientX - dragStartX.current;
    dragStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) return;

    goTo(delta < 0 ? 1 : -1);
  };

  const current = popups[index];
  const hasLink = Boolean(current.link);
  const isExternal = hasLink && !current.link.startsWith('/');

  const handleImageClick = () => {
    if (!hasLink) return;

    close();

    if (isExternal) {
      window.open(current.link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(current.link);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invitación"
        className="relative w-full max-w-lg animate-modal-panel select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-stone-900 text-white border border-stone-700 flex items-center justify-center shadow-lg hover:bg-stone-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`rounded-2xl overflow-hidden border shadow-2xl ${
          isDark ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-white'
        }`}>
          <button
            type="button"
            onClick={handleImageClick}
            className={`block w-full ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}
            aria-label={current.alt || 'Invitación'}
          >
            <img
              src={current.imageUrl}
              alt={current.alt || ''}
              className="w-full max-h-[80vh] object-contain bg-stone-950"
              draggable={false}
            />
          </button>
        </div>

        {popups.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Anterior"
              disabled={index === 0}
              className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-12 w-10 h-10 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Siguiente"
              className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-12 w-10 h-10 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mt-4" role="tablist" aria-label="Imágenes">
              {popups.map((popup, dotIndex) => (
                <button
                  key={popup.id}
                  type="button"
                  role="tab"
                  aria-selected={dotIndex === index}
                  aria-label={`Ver imagen ${dotIndex + 1} de ${popups.length}`}
                  onClick={() => setIndex(dotIndex)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIndex === index ? 'w-8 bg-amber-500' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
