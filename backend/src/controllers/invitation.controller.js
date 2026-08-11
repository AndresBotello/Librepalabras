import {
  createInvitation,
  findValidInvitation,
  listInvitations,
  markEmailSent,
  revokeInvitation,
} from '../services/invitation.service.js';
import { isEmailEnabled, renderInvitationEmail, sendMail } from '../services/email.service.js';

const SITE_NAME = process.env.SITE_NAME || 'Liberapalabras';

function buildInviteUrl(token) {
  const base = (process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');

  return `${base}/register?invite=${token}`;
}

/**
 * Crea la invitación y devuelve el enlace. El correo es un intento adicional:
 * si SMTP no está configurado o el envío falla, la invitación sigue siendo
 * válida y el admin la comparte copiando el enlace desde el panel.
 */
export async function postInvitation(req, res) {
  try {
    const { email, role } = req.body;

    const { id, token, invitation } = await createInvitation({
      email,
      role,
      invitedBy: req.auth?.uid,
      invitedByName: req.user?.nombres || req.user?.name || 'Un administrador',
    });

    const inviteUrl = buildInviteUrl(token);
    let emailResult = { sent: false, reason: 'smtp-not-configured' };

    if (isEmailEnabled()) {
      const { html, text } = renderInvitationEmail({
        inviteUrl,
        role: invitation.role,
        invitedByName: invitation.invitedByName,
        siteName: SITE_NAME,
        expiresAt: invitation.expiresAt,
      });

      emailResult = await sendMail({
        to: invitation.email,
        subject: `Te invitaron a ${SITE_NAME}`,
        html,
        text,
      });

      if (emailResult.sent) {
        await markEmailSent(id, true);
      }
    }

    return res.status(201).json({
      ok: true,
      message: emailResult.sent
        ? `Invitación enviada por correo a ${invitation.email}`
        : 'Invitación creada. Copia el enlace y compártelo con la persona.',
      // Única aparición del token en toda la aplicación: no vuelve a estar
      // disponible ni para el propio admin.
      inviteUrl,
      emailSent: emailResult.sent,
      invitation: {
        id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.status ? error.message : 'Error al crear la invitación',
    });
  }
}

export async function getInvitations(req, res) {
  try {
    const invitations = await listInvitations({
      status: req.query.status || 'all',
      limit: req.query.limit,
    });

    return res.json({
      ok: true,
      invitations,
      total: invitations.length,
      emailEnabled: isEmailEnabled(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener las invitaciones',
      error: error.message,
    });
  }
}

export async function deleteInvitation(req, res) {
  try {
    const invitation = await revokeInvitation(req.params.id, req.auth?.uid);

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        message: 'Invitación no encontrada',
      });
    }

    return res.json({
      ok: true,
      message: 'Invitación revocada. El enlace dejó de funcionar.',
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      message: error.status ? error.message : 'Error al revocar la invitación',
    });
  }
}

/**
 * Endpoint público que consulta la pantalla de registro para saber a quién va
 * dirigida la invitación. Solo devuelve el correo y el rol —nunca quién invitó
 * ni cuántas invitaciones hay— y responde igual (404) para un token inexistente
 * que para uno caducado.
 */
export async function getInvitationByToken(req, res) {
  try {
    const invitation = await findValidInvitation(req.params.token);

    if (!invitation) {
      return res.status(404).json({
        ok: false,
        message: 'La invitación no existe, ya se usó o caducó.',
      });
    }

    return res.json({
      ok: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        invitedByName: invitation.invitedByName,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al validar la invitación',
      error: error.message,
    });
  }
}
