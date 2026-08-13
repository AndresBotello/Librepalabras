/**
 * Puente entre los campos `datetime-local` del navegador y las fechas ISO que
 * guarda el backend.
 *
 * `datetime-local` no lleva zona horaria: "2026-09-17T14:20" es una hora
 * suelta. Si esa cadena viajara tal cual, el servidor la interpretaría en *su*
 * zona (UTC en el hosting) y un evento de las 2:20 p.m. en Colombia quedaría
 * guardado a las 9:20 a.m. Por eso la conversión a instante absoluto se hace en
 * el navegador, que sí sabe en qué zona está quien lo programa.
 */

/** "2026-09-17T14:20" (hora local) → "2026-09-17T19:20:00.000Z" */
export function localInputToIso(value) {
  if (!value) return '';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** "2026-09-17T19:20:00.000Z" → "2026-09-17T14:20" (hora local) */
export function isoToLocalInput(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localMs = date.getTime() - date.getTimezoneOffset() * 60000;
  return new Date(localMs).toISOString().slice(0, 16);
}
