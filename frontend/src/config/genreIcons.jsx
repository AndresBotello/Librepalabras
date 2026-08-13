import React from 'react';
import {
  BookMarked,
  BookOpen,
  Drama,
  Feather,
  Library,
  Newspaper,
  NotebookPen,
  Palette,
  Quote,
  ScrollText,
  UserRound,
} from 'lucide-react';


const GENRE_ICONS = {
  cuento: BookOpen,
  'poesía': Feather,
  novela: BookMarked,
  ensayo: ScrollText,
  drama: Drama,
  'crónica': Newspaper,
  'biografía': UserRound,
  microrrelato: Quote,
  cuaderno: NotebookPen,
  otro: Palette,
};

/** Icono del catálogo completo, para la entrada "toda la biblioteca". */
export const AllGenresIcon = Library;

export function getGenreIcon(genre) {
  return GENRE_ICONS[genre] || BookOpen;
}

/**
 * Pinta el icono del género. Se expone como componente en vez de devolver el
 * tipo para que en el punto de uso no haga falta guardar el resultado en una
 * variable con mayúscula, que es un patrón que el compilador de React marca
 * como "crear un componente durante el render".
 */
export function GenreIcon({ genre, className = 'w-4 h-4 shrink-0', strokeWidth = 1.5 }) {
  // `createElement` en vez de guardar el tipo en una variable con mayúscula y
  // usarla como JSX: ese patrón lo marca el compilador de React como "crear un
  // componente durante el render", aunque aquí solo se esté eligiendo uno ya
  // existente de una tabla fija.
  return React.createElement(getGenreIcon(genre), { className, strokeWidth });
}
