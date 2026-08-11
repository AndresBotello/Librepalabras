import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Avisos flotantes que sustituyen a `window.alert`.
 *
 * A diferencia del alert, no bloquean ni exigen un clic: aparecen abajo a la
 * derecha, se van solos y se pueden cerrar. "Perfil actualizado" no debería
 * detener a nadie a mitad de lo que está haciendo.
 *
 * El contenedor lleva `aria-live="polite"`, así que un lector de pantalla
 * anuncia cada aviso nuevo sin interrumpir lo que estuviera leyendo.
 */

const VARIANTS = {
  success: { icon: '✓', dark: 'bg-emerald-950 border-emerald-800 text-emerald-200', light: 'bg-white border-emerald-200 text-emerald-900', accent: 'text-emerald-500' },
  error: { icon: '✕', dark: 'bg-rose-950 border-rose-800 text-rose-200', light: 'bg-white border-rose-200 text-rose-900', accent: 'text-rose-500' },
  info: { icon: 'i', dark: 'bg-gray-800 border-gray-700 text-gray-200', light: 'bg-white border-gray-200 text-gray-800', accent: 'text-amber-600' },
};

export default function ToastStack({ toasts, onDismiss }) {
  const { isDark } = useContext(ThemeContext);

  // Sin avisos no se renderiza el contenedor: si quedara siempre en el DOM,
  // su caja invisible podría interceptar clics en la esquina de la pantalla.
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[110] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const variant = VARIANTS[toast.type] || VARIANTS.info;

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-modal-panel ${
              isDark ? variant.dark : variant.light
            }`}
          >
            <span
              className={`w-5 h-5 shrink-0 mt-0.5 rounded-full flex items-center justify-center text-xs font-bold ${variant.accent}`}
              aria-hidden="true"
            >
              {variant.icon}
            </span>

            <p className="flex-1 text-sm leading-relaxed break-words">{toast.message}</p>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar aviso"
              className={`shrink-0 -mr-1 -mt-0.5 w-6 h-6 rounded flex items-center justify-center text-sm transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
