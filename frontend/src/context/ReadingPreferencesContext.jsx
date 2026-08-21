import React, { createContext, useContext, useEffect, useState } from 'react';

export const ReadingPreferencesContext = createContext();

const STORAGE_KEY = 'readingPreferences';

/**
 * Tamaños en pasos, no en un rango libre: cuatro botones (A-, A, A+, A++) son
 * más fáciles de usar a ciegas que un slider, y para el caso de uso —"un poco
 * más grande" o "mucho más grande"— sobran.
 */
export const FONT_SCALE_STEPS = [100, 115, 130, 145];

/**
 * Pila de letra "de alta legibilidad" sin depender de ninguna fuente externa:
 * Comic Sans y Comic Neue son, con toda su fama, las que más gente con
 * dislexia reporta que le resultan más fáciles de leer (letras muy
 * distinguibles entre sí), y ya vienen instaladas o las trae el sistema en
 * casi cualquier equipo. No hace falta cargar OpenDyslexic desde un CDN para
 * conseguir el mismo efecto práctico.
 */
export const DYSLEXIA_FONT_STACK = '"Comic Sans MS", "Comic Neue", Verdana, sans-serif';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function ReadingPreferencesProvider({ children }) {
  const [fontScaleIndex, setFontScaleIndex] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);

  useEffect(() => {
    const saved = loadSaved();
    if (!saved) return;

    if (Number.isInteger(saved.fontScaleIndex) && FONT_SCALE_STEPS[saved.fontScaleIndex] !== undefined) {
      setFontScaleIndex(saved.fontScaleIndex);
    }
    if (typeof saved.highContrast === 'boolean') setHighContrast(saved.highContrast);
    if (typeof saved.dyslexiaFont === 'boolean') setDyslexiaFont(saved.dyslexiaFont);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontScaleIndex, highContrast, dyslexiaFont }));
  }, [fontScaleIndex, highContrast, dyslexiaFont]);

  const increaseFontScale = () => setFontScaleIndex((index) => Math.min(index + 1, FONT_SCALE_STEPS.length - 1));
  const decreaseFontScale = () => setFontScaleIndex((index) => Math.max(index - 1, 0));
  const toggleHighContrast = () => setHighContrast((value) => !value);
  const toggleDyslexiaFont = () => setDyslexiaFont((value) => !value);

  const resetReadingPreferences = () => {
    setFontScaleIndex(0);
    setHighContrast(false);
    setDyslexiaFont(false);
  };

  const value = {
    fontScale: FONT_SCALE_STEPS[fontScaleIndex],
    fontScaleIndex,
    maxFontScaleIndex: FONT_SCALE_STEPS.length - 1,
    highContrast,
    dyslexiaFont,
    increaseFontScale,
    decreaseFontScale,
    toggleHighContrast,
    toggleDyslexiaFont,
    resetReadingPreferences,
    isDefault: fontScaleIndex === 0 && !highContrast && !dyslexiaFont,
  };

  return (
    <ReadingPreferencesContext.Provider value={value}>
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export function useReadingPreferences() {
  const context = useContext(ReadingPreferencesContext);

  if (!context) {
    throw new Error('useReadingPreferences debe usarse dentro de ReadingPreferencesProvider');
  }

  return context;
}

/**
 * El estilo en línea que hay que aplicar al contenedor del texto largo.
 *
 * `zoom` y no un `font-size` en el contenedor: el sitio mide su tipografía en
 * `rem` (las utilidades de Tailwind), que se calcula siempre contra la raíz
 * del documento y no contra el contenedor que la envuelve, así que cambiar el
 * `font-size` de un ancestro no mueve nada. `zoom` sí escala todo lo de dentro
 * —incluida esa tipografía en rem— y lo hace solo dentro del contenedor, sin
 * tocar el resto de la página.
 */
export function readingContentStyle({ fontScale, dyslexiaFont }) {
  return {
    zoom: fontScale / 100,
    ...(dyslexiaFont
      ? { fontFamily: DYSLEXIA_FONT_STACK, letterSpacing: '0.02em', lineHeight: 1.9 }
      : {}),
  };
}
