import contestsData from '../config/contests.json';

/**
 * Definición local de los concursos: copia de backend/src/config/contests.json.
 * Sirve para pintar la sección mientras llega el catálogo del backend, que es
 * quien manda sobre el estado (lo fija el administrador).
 *
 * Úsala a través de useContestCatalog, no directamente: aquí el `status` puede
 * estar desactualizado.
 */
export const CONTESTS = contestsData.contests;

export const CONTEST_STATUS_META = {
  abierto: { label: 'Inscripciones abiertas', tone: 'emerald' },
  proximamente: { label: 'Próximamente', tone: 'amber' },
  cerrado: { label: 'Edición cerrada', tone: 'stone' },
};
