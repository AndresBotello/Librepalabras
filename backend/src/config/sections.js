import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { sections } = JSON.parse(readFileSync(join(__dirname, 'sections.json'), 'utf-8'));

const BY_VALUE = new Map(sections.map((section) => [section.value, section]));

export const SECTIONS = sections;

/** La sección con ese valor (`ninos`, `palabras`), o `undefined` si no existe. */
export function getSection(value) {
  return BY_VALUE.get(value);
}

/**
 * Dónde se lee una obra en el sitio. Las obras de una sección no se abren en la
 * biblioteca general: tienen su propia página, y los avisos y el buscador deben
 * apuntar ahí.
 */
export function workPath(work) {
  const section = getSection(work?.section);

  return section
    ? `${section.path}?obra=${encodeURIComponent(work.id)}`
    : `/stories?obra=${encodeURIComponent(work.id)}`;
}
