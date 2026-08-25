import { useMemo } from 'react';

// El mismo mínimo que aplica el servidor (ver `search.service.js`).
export const MIN_QUERY_LENGTH = 2;

/**
 * Copia de las palabras vacías del servidor (`search.service.js`). Solo se usa
 * para no subrayar palabras que la búsqueda descartó: resaltar el «de» de un
 * título cuando nadie buscó «de» es ruido que confunde.
 */
const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
  'y', 'o', 'en', 'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'lo', 'es',
]);

/**
 * Texto sin tildes ni mayúsculas **conservando la longitud**, para poder buscar
 * posiciones aquí y recortar sobre el original.
 *
 * `String.normalize('NFD')` no sirve tal cual: parte «í» en dos caracteres y
 * cualquier posición calculada sobre el resultado se desplaza respecto al texto
 * de partida. Aquí se normaliza carácter a carácter y se descarta el cambio
 * cuando no deja exactamente una unidad.
 */
export function foldKeepingLength(text) {
  let folded = '';

  for (const character of text) {
    if (character.length > 1) {
      folded += character;
      continue;
    }

    const base = character.normalize('NFD')[0].toLowerCase();
    folded += base.length === 1 ? base : character;
  }

  return folded;
}

function isWordCharacter(character) {
  return character !== undefined && /[\p{L}\p{N}]/u.test(character);
}

/**
 * Parte el texto en trozos marcando los que coinciden con algún término.
 *
 * Se exige que la coincidencia empiece una palabra, la misma regla con la que
 * el servidor puntúa: si no, buscar «nada» subrayaría el final de «dominada» y
 * el resaltado contaría una historia distinta de la del buscador.
 */
export function splitByTerms(text, terms) {
  if (!text || terms.length === 0) return [{ text, match: false }];

  const folded = foldKeepingLength(text);
  const ranges = [];

  for (const term of terms) {
    let from = 0;

    while (from <= folded.length - term.length) {
      const at = folded.indexOf(term, from);
      if (at === -1) break;

      if (!isWordCharacter(folded[at - 1])) {
        ranges.push([at, at + term.length]);
      }

      from = at + 1;
    }
  }

  if (ranges.length === 0) return [{ text, match: false }];

  ranges.sort((a, b) => a[0] - b[0]);

  const pieces = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    // Los términos pueden solaparse ("poe" y "poesia" sobre el mismo título):
    // lo que ya quedó dentro de un trozo resaltado no se vuelve a abrir.
    if (end <= cursor) continue;

    const from = Math.max(start, cursor);
    if (from > cursor) pieces.push({ text: text.slice(cursor, from), match: false });

    pieces.push({ text: text.slice(from, end), match: true });
    cursor = end;
  }

  if (cursor < text.length) pieces.push({ text: text.slice(cursor), match: false });

  return pieces;
}

/** Los términos tal como los entiende el servidor, para resaltarlos igual. */
export function useHighlightTerms(term) {
  return useMemo(() => {
    const tokens = foldKeepingLength(term)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length >= MIN_QUERY_LENGTH);

    const meaningful = tokens.filter((token) => !STOPWORDS.has(token));
    return [...new Set(meaningful.length ? meaningful : tokens)];
  }, [term]);
}
