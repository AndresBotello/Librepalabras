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

