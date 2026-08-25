import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Definición de los concursos: qué certámenes existen, cómo se llaman y a quién
 * van dirigidos. Es un archivo porque son datos editoriales que no cambian solos.
 *
 * Lo que sí cambia —quién está abierto y en qué edición va— lo decide el
 * administrador desde el panel y se guarda en Firestore; `status` y `edition`
 * de este archivo son únicamente el valor inicial mientras nadie lo haya
 * tocado. Usa `mergeContestStates` para obtener el estado real.
 *
 * `status`:
 *   - abierto        recibe inscripciones
 *   - proximamente   ya se anuncia, todavía no recibe nada
 *   - cerrado        edición terminada; su podio aparece en Ganadores
 */
const { contests } = JSON.parse(readFileSync(join(__dirname, 'contests.json'), 'utf-8'));

export const CONTESTS = contests;

export const CONTEST_STATUSES = ['proximamente', 'abierto', 'cerrado'];

/** Aplica sobre el catálogo lo que el administrador haya guardado. */
export function mergeContestStates(states = {}) {
  return CONTESTS.map((contest) => {
    const saved = states[contest.id] || {};

    return {
      ...contest,
      name: saved.name?.trim() ? saved.name : contest.name,
      status: CONTEST_STATUSES.includes(saved.status) ? saved.status : contest.status,
      edition: saved.edition !== undefined ? saved.edition : contest.edition,
      updatedAt: saved.updatedAt || null,
    };
  });
}

/**
 * Los cuentos inscritos antes de que existiera más de un concurso no tienen
 * `contestId`: pertenecen al institucional, que era el único que había.
 */
export const DEFAULT_CONTEST_ID = 'cuento-corto-institucional';

export function getContest(id) {
  return CONTESTS.find((contest) => contest.id === id) || null;
}

export function normalizeContestId(id) {
  return getContest(id) ? id : DEFAULT_CONTEST_ID;
}

/**
 * La edición a la que pertenece un cuento.
 *
 * La edición se sella en el documento al inscribirlo, y no se vuelve a tocar:
 * si mañana el administrador pone la convocatoria en 2027, los cuentos de 2026
 * siguen siendo de 2026. Por eso hay que leerla del cuento y nunca del
 * catálogo, que solo dice cuál es la edición *vigente*.
 *
 * Los cuentos anteriores a este sellado no la tienen. A esos se les asigna la
 * edición inicial del archivo, que es la que estaba corriendo cuando se
 * enviaron: el archivo conserva el valor de partida porque los cambios del
 * administrador viven en Firestore, no aquí.
 */
export function storyEdition(story) {
  if (story?.edition) return String(story.edition);

  const contest = getContest(normalizeContestId(story?.contestId));
  return contest?.edition || '';
}

/** Etiqueta de una edición para leer: "2026", o "Sin edición" si nunca se puso. */
export function editionLabel(edition) {
  return edition || 'Sin edición';
}

