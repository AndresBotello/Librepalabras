import React, { useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Diálogo de confirmación de la aplicación. No se usa directamente: lo monta
 * `DialogProvider` cuando alguien llama a `confirm()`.
 *
 * Lo que el cuadro nativo del navegador no hace y aquí sí:
 *
 * - Devuelve el foco al elemento que abrió el diálogo al cerrarse. Sin esto,
 *   quien navega con teclado vuelve al principio de la página tras cada
 *   confirmación.
 * - Atrapa el Tab dentro del panel mientras está abierto.
 * - En las acciones destructivas el foco arranca en «Cancelar», no en el botón
 *   rojo: pulsar Enter por inercia no debe borrar nada.
 */

export default function ConfirmDialog({
  title,
  message,
  detail,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}) {
  const { isDark } = useContext(ThemeContext);
  const panelRef = useRef(null);
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  const isDanger = variant === 'danger';

  useEffect(() => {
    const previouslyFocused = document.activeElement;

    // En una acción irreversible el foco va a Cancelar; en el resto, al botón
    // principal, que es lo que la persona viene buscando.
    const target = isDanger ? cancelRef.current : confirmRef.current;
    target?.focus();

    // El fondo no debe poder desplazarse mientras el diálogo está abierto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll('button');
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Cierra el ciclo del tabulador en los extremos para que el foco no se
      // escape a la página de detrás, que está inerte.
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
  }, [isDanger, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-overlay"
      // Click en el fondo = cancelar. Se comprueba que el clic sea en el fondo
      // y no en el panel, que es hijo suyo.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? 'confirm-message' : undefined}
        className={`w-full max-w-md rounded-2xl border shadow-2xl animate-modal-panel ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-6">
          <div className="flex gap-4">
            <span
              className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-xl ${
                isDanger
                  ? isDark ? 'bg-rose-950 text-rose-400' : 'bg-rose-100 text-rose-600'
                  : isDark ? 'bg-amber-950 text-amber-400' : 'bg-amber-100 text-amber-700'
              }`}
              aria-hidden="true"
            >
              {isDanger ? '⚠' : '?'}
            </span>

            <div className="min-w-0 flex-1">
              <h2
                id="confirm-title"
                className={`text-lg font-bold leading-snug ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {title}
              </h2>

              {message && (
                <p
                  id="confirm-message"
                  className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {message}
                </p>
              )}

              {/* Para identificadores y rutas: en monoespaciada y con corte por
                  carácter, porque son cadenas largas sin espacios. */}
              {detail && (
                <p className={`mt-3 px-3 py-2 rounded-lg text-xs font-mono break-all ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {detail}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t rounded-b-2xl ${
          isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'
        }`}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDark
                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 focus-visible:ring-gray-500 focus-visible:ring-offset-gray-900'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400 focus-visible:ring-offset-gray-50'
            }`}
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500'
                : 'bg-[#5D4037] hover:bg-[#4A302A] focus-visible:ring-[#5D4037]'
            } ${isDark ? 'focus-visible:ring-offset-gray-900' : 'focus-visible:ring-offset-gray-50'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
