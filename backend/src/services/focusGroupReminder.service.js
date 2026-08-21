import { adminDb } from '../config/firebaseAdmin.js';
import { isEmailEnabled, renderFocusGroupReminderEmail, sendMail } from './email.service.js';
import { listAttendees, listSyncSessionsPendingReminder, markReminderSent } from './focusGroup.service.js';

/**
 * Recordatorio automático de una cátedra, un día antes.
 *
 * No hay cola de trabajos en este backend (es un único proceso Node siempre
 * vivo, ver server.js), así que un `setInterval` que revisa cada cierto
 * tiempo es toda la infraestructura que hace falta: no se justifica sumar una
 * dependencia de cron para un aviso diario.
 *
 * `reminderSentAt` en la sesión es el candado: una vez se manda el correo (o
 * se decide que ya no corresponde mandarlo) se marca, y esa cátedra sale de la
 * consulta de pendientes para siempre. Reprogramar la fecha lo reabre — ver
 * `updateFocusGroupSession`.
 */

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

function buildSessionUrl(sessionId) {
  const base = (process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');

  return `${base}/grupo-focal/${sessionId}`;
}

async function remindSession(session) {
  const attendees = await listAttendees(session.id);
  const sessionUrl = buildSessionUrl(session.id);

  await Promise.all(
    attendees
      .filter((attendee) => attendee.email)
      .map((attendee) => {
        const { html, text } = renderFocusGroupReminderEmail({
          session,
          attendeeName: attendee.name,
          sessionUrl,
        });

        return sendMail({
          to: attendee.email,
          subject: `Recordatorio: "${session.title}" es mañana`,
          html,
          text,
        });
      })
  );

  await markReminderSent(session.id);
}

/** Exportada aparte para poder probarla o dispararla a mano sin esperar al intervalo. */
export async function runFocusGroupReminderSweep() {
  if (!adminDb || !isEmailEnabled()) {
    return;
  }

  const now = Date.now();
  const pending = await listSyncSessionsPendingReminder();

  for (const session of pending) {
    const start = new Date(session.scheduledAt).getTime();

    if (Number.isNaN(start)) {
      continue;
    }

    // Ya pasó sin que nadie la recordara (se publicó tarde, o el servidor
    // estuvo caído durante la ventana). Avisar de un encuentro que ya ocurrió
    // no tiene sentido; se marca para que deje de aparecer en la consulta.
    if (start <= now) {
      await markReminderSent(session.id);
      continue;
    }

    // Todavía falta más de un día: se revisa de nuevo en el siguiente barrido.
    if (start - now > REMINDER_WINDOW_MS) {
      continue;
    }

    try {
      await remindSession(session);
    } catch (error) {
      console.error(`No se pudo enviar el recordatorio de "${session.title}":`, error.message);
    }
  }
}

let intervalHandle = null;

export function startFocusGroupReminders() {
  if (intervalHandle) {
    return;
  }

  intervalHandle = setInterval(() => {
    runFocusGroupReminderSweep().catch((error) => {
      console.error('Error en el barrido de recordatorios del grupo focal:', error.message);
    });
  }, CHECK_INTERVAL_MS);

  // Y una pasada al arrancar, para no esperar el primer intervalo completo.
  runFocusGroupReminderSweep().catch((error) => {
    console.error('Error en el barrido de recordatorios del grupo focal:', error.message);
  });
}
