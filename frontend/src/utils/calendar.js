/**
 * Genera y descarga un archivo .ics para un encuentro del Grupo Focal.
 *
 * No hace falta ninguna librería para esto: el formato iCalendar es texto
 * plano con un puñado de campos obligatorios, y un encuentro solo necesita
 * los más básicos (fecha de inicio, duración, título, enlace).
 */

function pad(value) {
  return String(value).padStart(2, '0');
}

/** Fecha en UTC y formato iCalendar (AAAAMMDDTHHMMSSZ): así el evento cae en
 *  la hora correcta sin importar la zona horaria de quien lo importa. */
function toIcsDate(isoString) {
  const date = new Date(isoString);

  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Escapa los caracteres que el formato reserva (coma, punto y coma, salto de línea). */
function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildIcsContent(session) {
  const start = new Date(session.scheduledAt);
  const end = new Date(start.getTime() + (session.duration || 90) * 60 * 1000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LibrePalabras//Grupo Focal//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:focus-group-${session.id}@librepalabras`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(start.toISOString())}`,
    `DTEND:${toIcsDate(end.toISOString())}`,
    `SUMMARY:${escapeIcsText(session.title)}`,
    `DESCRIPTION:${escapeIcsText(session.description)}`,
    session.meetingUrl ? `LOCATION:${escapeIcsText(session.meetingUrl)}` : null,
    session.meetingUrl ? `URL:${escapeIcsText(session.meetingUrl)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  // El salto de línea del formato es CRLF, no LF.
  return lines.join('\r\n');
}

/** Dispara la descarga del .ics para un encuentro síncrono. */
export function downloadSessionIcs(session) {
  const blob = new Blob([buildIcsContent(session)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${session.title.slice(0, 60).replace(/[\\/:*?"<>|]/g, '')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
