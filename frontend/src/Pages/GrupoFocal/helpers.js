/**
 * Ayudantes de presentación que comparten el listado del grupo focal, la ficha
 * de un encuentro y la tarjeta. Van en un módulo aparte —y no junto al
 * componente— porque un archivo que exporta componentes y funciones a la vez
 * rompe el refresco en caliente de Vite.
 */

export function formatMeetingDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Color del distintivo según el estado de la reunión. */
export function stateBadgeClasses(state, isDark) {
  if (state === 'en_curso') {
    return isDark
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (state === 'finalizado') {
    return isDark
      ? 'bg-stone-800 text-stone-400 border-stone-700'
      : 'bg-stone-100 text-stone-500 border-stone-200';
  }

  return isDark
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-amber-50 text-amber-700 border-amber-200';
}
