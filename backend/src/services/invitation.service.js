import { createHash, randomBytes } from 'crypto';
import { adminDb, isValidRole } from '../config/firebaseAdmin.js';
import { queryOrderedWithFallback } from '../utils/firestoreQuery.js';

/**
 * Invitación con rol preasignado.
 *
 * El token en claro se devuelve UNA sola vez, al crear la invitación, para
 * armar el enlace. En Firestore solo queda su SHA-256: si alguien llegara a
 * leer la colección no podría reconstruir enlaces válidos, igual que no se
 * guardan contraseñas en claro.
 *
 * El id del documento es el hash, así que validar un token es una lectura
 * directa por clave —no una consulta con `where`— y no hace falta índice.
 */

const COLLECTION = 'invitations';
const DEFAULT_TTL_DAYS = 7;

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVOKED: 'revoked',
};

function collection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection(COLLECTION);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

export async function createInvitation({ email, role, invitedBy, invitedByName, ttlDays = DEFAULT_TTL_DAYS }) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw Object.assign(new Error('El correo no tiene un formato válido'), { status: 400 });
  }

  if (!isValidRole(role)) {
    throw Object.assign(new Error('El rol de la invitación no es válido'), { status: 400 });
  }

  // Invitar a alguien que ya tiene cuenta no haría nada: el rol solo se aplica
  // al crear el perfil. Mejor decirlo que dejar una invitación que no surtirá
  // efecto y que el admin creerá enviada.
  const existingUser = await adminDb
    .collection('users')
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!existingUser.empty) {
    throw Object.assign(
      new Error('Ese correo ya tiene una cuenta. Cambia su rol desde la lista de usuarios.'),
      { status: 409 }
    );
  }

  await revokePendingInvitationsFor(normalizedEmail, invitedBy);

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  const invitation = {
    email: normalizedEmail,
    role,
    status: INVITATION_STATUS.PENDING,
    invitedBy: invitedBy || null,
    invitedByName: invitedByName || 'Un administrador',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    acceptedAt: null,
    acceptedBy: null,
    emailSent: false,
  };

  await collection().doc(tokenHash).set(invitation);

  // `token` viaja al controlador para construir el enlace y NO se persiste.
  return { id: tokenHash, token, invitation: { id: tokenHash, ...invitation } };
}

/**
 * Un correo con dos invitaciones vivas es ambiguo: si el admin reinvita con un
 * rol distinto, la anterior debe dejar de valer.
 */
async function revokePendingInvitationsFor(email, revokedBy) {
  const snapshot = await collection()
    .where('email', '==', email)
    .where('status', '==', INVITATION_STATUS.PENDING)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = adminDb.batch();
  const now = new Date().toISOString();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: INVITATION_STATUS.REVOKED,
      revokedAt: now,
      revokedBy: revokedBy || null,
    });
  });

  await batch.commit();
}

/**
 * Valida un token en claro. Devuelve null si no existe, ya se usó, se revocó o
 * caducó: quien llama no necesita distinguir los casos, y no distinguirlos evita
 * que el endpoint público sirva para averiguar qué tokens existen.
 */
export async function findValidInvitation(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const snapshot = await collection().doc(hashToken(token)).get();

  if (!snapshot.exists) {
    return null;
  }

  const invitation = { id: snapshot.id, ...snapshot.data() };

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    return null;
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    return null;
  }

  return invitation;
}

/**
 * Marca la invitación como aceptada. Se exige que el correo de la cuenta
 * coincida con el invitado: sin esa comprobación, un enlace filtrado le daría
 * el rol a cualquiera que lo abriese.
 */
export async function acceptInvitation(token, { uid, email }) {
  const invitation = await findValidInvitation(token);

  if (!invitation) {
    return null;
  }

  if (normalizeEmail(email) !== invitation.email) {
    return null;
  }

  await collection().doc(invitation.id).update({
    status: INVITATION_STATUS.ACCEPTED,
    acceptedAt: new Date().toISOString(),
    acceptedBy: uid,
  });

  return invitation;
}

export async function markEmailSent(id, sent) {
  await collection().doc(id).update({ emailSent: Boolean(sent) });
}

export async function revokeInvitation(id, revokedBy) {
  const docRef = collection().doc(id);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  if (snapshot.data().status !== INVITATION_STATUS.PENDING) {
    throw Object.assign(new Error('Solo se pueden revocar invitaciones pendientes'), { status: 409 });
  }

  await docRef.update({
    status: INVITATION_STATUS.REVOKED,
    revokedAt: new Date().toISOString(),
    revokedBy: revokedBy || null,
  });

  return { id, ...snapshot.data(), status: INVITATION_STATUS.REVOKED };
}

/**
 * El listado NUNCA incluye el token: ni siquiera en claro lo tenemos ya. Un
 * admin que pierda el enlace debe crear una invitación nueva, que es lo
 * correcto —así el enlace viejo deja de funcionar—.
 */
export async function listInvitations({ status = 'all', limit = 100 } = {}) {
  if (!adminDb) {
    return [];
  }

  let query = collection();

  if (status && status !== 'all') {
    query = query.where('status', '==', status);
  }

  const snapshot = await queryOrderedWithFallback(query, {
    orderField: 'createdAt',
    limit: Math.min(Number(limit) || 100, 200),
  });

  const now = new Date();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const expired = data.status === INVITATION_STATUS.PENDING && new Date(data.expiresAt) < now;

    return {
      id: doc.id,
      email: data.email,
      role: data.role,
      // El estado "caducada" se calcula al leer en vez de guardarse: no hay
      // proceso programado que recorra la colección marcando vencimientos.
      status: expired ? 'expired' : data.status,
      invitedByName: data.invitedByName,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      acceptedAt: data.acceptedAt,
      emailSent: Boolean(data.emailSent),
    };
  });
}
