import nodemailer from 'nodemailer';

/**
 * Envío de correo transaccional, deliberadamente opcional.
 *
 * Sin SMTP_USER y SMTP_PASS el servicio queda inactivo y `sendMail` devuelve
 * `{ sent: false }` en vez de lanzar. Eso permite que las invitaciones
 * funcionen desde el primer día: el panel siempre genera un enlace que el
 * administrador puede copiar y compartir por donde quiera, y el correo es un
 * extra que se activa cuando haya credenciales configuradas.
 *
 * Con Gmail hay que usar una contraseña de aplicación (Cuenta de Google →
 * Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones). La
 * contraseña normal de la cuenta no funciona por SMTP.
 */

let transporter = null;
let initialized = false;

function getTransporter() {
  if (initialized) {
    return transporter;
  }

  initialized = true;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.log('ℹ Correo desactivado: falta SMTP_USER / SMTP_PASS (las invitaciones se comparten por enlace)');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) !== 587,
    auth: { user, pass },
  });

  console.log('✓ Correo habilitado vía SMTP');
  return transporter;
}

export function isEmailEnabled() {
  return Boolean(getTransporter());
}

/**
 * Nunca lanza. Quien envía un correo lo hace como efecto secundario de otra
 * acción (crear una invitación), y esa acción no debe fallar porque el buzón
 * de destino rebote o Gmail esté caído.
 */
export async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter();

  if (!transport) {
    return { sent: false, reason: 'smtp-not-configured' };
  }

  try {
    const from = process.env.SMTP_FROM
      || `"${process.env.SITE_NAME || 'Liberapalabras'}" <${process.env.SMTP_USER}>`;

    const info = await transport.sendMail({ from, to, subject, html, text });

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`No se pudo enviar el correo a ${to}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

const BRAND_COLOR = '#5D4037';

/** Plantilla mínima y sobria; el correo se ve igual en clientes que no cargan CSS. */
export function renderInvitationEmail({ inviteUrl, role, invitedByName, siteName, expiresAt }) {
  const roleLabels = {
    admin: 'Administrador',
    collaborator: 'Colaborador',
    judge: 'Jurado',
    user: 'Usuario',
  };

  const roleLabel = roleLabels[role] || role;
  const expiryText = new Date(expiresAt).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1c1917;">
    <h1 style="font-size:22px;margin:0 0 16px;color:${BRAND_COLOR};">Te invitaron a ${siteName}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
      ${invitedByName} te invitó a unirte como <strong>${roleLabel}</strong>.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
      Crea tu cuenta con este enlace y el rol se asignará automáticamente.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${inviteUrl}"
         style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">
        Aceptar invitación
      </a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:#57534e;margin:0 0 8px;">
      La invitación caduca el ${expiryText}.
    </p>
    <p style="font-size:13px;line-height:1.6;color:#57534e;margin:0;">
      Si el botón no funciona, copia esta dirección en tu navegador:<br>
      <span style="word-break:break-all;color:${BRAND_COLOR};">${inviteUrl}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0;">
    <p style="font-size:12px;color:#a8a29e;margin:0;">
      Si no esperabas esta invitación, puedes ignorar este correo.
    </p>
  </div>`;

  const text = `${invitedByName} te invitó a unirte a ${siteName} como ${roleLabel}.\n\n`
    + `Acepta la invitación aquí: ${inviteUrl}\n\n`
    + `La invitación caduca el ${expiryText}.`;

  return { html, text };
}

/** Recordatorio de una cátedra del Grupo Focal, para quien confirmó asistencia. */
export function renderFocusGroupReminderEmail({ session, attendeeName, sessionUrl }) {
  const whenText = new Date(session.scheduledAt).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1c1917;">
    <h1 style="font-size:22px;margin:0 0 16px;color:${BRAND_COLOR};">Tu cátedra es mañana</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">
      Hola${attendeeName ? ` ${attendeeName}` : ''}, confirmaste tu asistencia a <strong>${session.title}</strong>.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
      Empieza el <strong>${whenText}</strong> (hora de Colombia).
    </p>
    <p style="margin:0 0 16px;">
      <a href="${session.meetingUrl}"
         style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">
        Entrar a la videollamada
      </a>
    </p>
    ${sessionUrl ? `<p style="font-size:13px;line-height:1.6;color:#57534e;margin:0 0 8px;">
      También puedes ver el detalle del encuentro aquí:<br>
      <span style="word-break:break-all;color:${BRAND_COLOR};">${sessionUrl}</span>
    </p>` : ''}
    <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0;">
    <p style="font-size:12px;color:#a8a29e;margin:0;">
      Recibiste este correo porque confirmaste tu asistencia a este encuentro. Si ya no puedes ir, puedes retirar tu confirmación desde la ficha del encuentro.
    </p>
  </div>`;

  const text = `Confirmaste tu asistencia a "${session.title}", que empieza el ${whenText} (hora de Colombia).\n\n`
    + `Enlace de la videollamada: ${session.meetingUrl}\n`
    + (sessionUrl ? `Detalle del encuentro: ${sessionUrl}\n` : '');

  return { html, text };
}
