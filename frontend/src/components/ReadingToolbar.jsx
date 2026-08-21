import React from 'react';
import { Contrast, RotateCcw, SpellCheck2, ZoomIn, ZoomOut } from 'lucide-react';
import { useReadingPreferences } from '../context/ReadingPreferencesContext';

/**
 * Controles de accesibilidad para una lectura larga: tamaño de letra, alto
 * contraste y una tipografía de mayor legibilidad. Vive junto al contenido
 * que ajusta (no en la barra de navegación) porque solo tiene sentido en las
 * páginas de lectura; el resto del sitio no cambia con estos controles.
 */
export default function ReadingToolbar({ isDark }) {
  const {
    fontScaleIndex,
    maxFontScaleIndex,
    highContrast,
    dyslexiaFont,
    increaseFontScale,
    decreaseFontScale,
    toggleHighContrast,
    toggleDyslexiaFont,
    resetReadingPreferences,
    isDefault,
  } = useReadingPreferences();

  const buttonBase = `inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border`;

  const inactiveClasses = isDark
    ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
    : 'border-stone-300 text-stone-700 hover:bg-stone-100';

  const activeClasses = isDark
    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
    : 'border-brand-700/40 bg-brand-700/10 text-brand-700';

  return (
    <div
      role="group"
      aria-label="Preferencias de lectura"
      className={`mb-6 flex flex-wrap items-center gap-2 rounded-2xl border p-3 ${
        isDark ? 'bg-stone-900/50 border-stone-800' : 'bg-white border-stone-200'
      }`}
    >
      <span className={`px-1 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
        Lectura
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={decreaseFontScale}
          disabled={fontScaleIndex === 0}
          aria-label="Reducir tamaño de letra"
          className={`${buttonBase} ${inactiveClasses} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className={`px-2 text-xs tabular-nums ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
          {fontScaleIndex + 1}/{maxFontScaleIndex + 1}
        </span>
        <button
          type="button"
          onClick={increaseFontScale}
          disabled={fontScaleIndex === maxFontScaleIndex}
          aria-label="Aumentar tamaño de letra"
          className={`${buttonBase} ${inactiveClasses} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={toggleHighContrast}
        aria-pressed={highContrast}
        className={`${buttonBase} ${highContrast ? activeClasses : inactiveClasses}`}
      >
        <Contrast className="w-3.5 h-3.5" />
        Alto contraste
      </button>

      <button
        type="button"
        onClick={toggleDyslexiaFont}
        aria-pressed={dyslexiaFont}
        className={`${buttonBase} ${dyslexiaFont ? activeClasses : inactiveClasses}`}
      >
        <SpellCheck2 className="w-3.5 h-3.5" />
        Tipografía fácil de leer
      </button>

      {!isDefault && (
        <button
          type="button"
          onClick={resetReadingPreferences}
          aria-label="Restablecer preferencias de lectura"
          className={`${buttonBase} ${inactiveClasses} ml-auto`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer
        </button>
      )}
    </div>
  );
}
