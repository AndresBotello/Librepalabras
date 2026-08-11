import { Router } from 'express';
import { getInvitationByToken } from '../controllers/invitation.controller.js';

const router = Router();

/**
 * Público a la fuerza: quien abre el enlace todavía no tiene cuenta, así que no
 * puede haber sesión que validar. La protección es el propio token, que solo
 * conoce quien recibió la invitación.
 *
 * Crear y revocar invitaciones vive en /api/admin/invitations, con rol admin.
 */
router.get('/:token', getInvitationByToken);

export default router;
