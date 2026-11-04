import { adminAuth, adminDb, defaultUserRole, getRoleForEmail, isValidRole } from '../config/firebaseAdmin.js';

import { invalidateRegisteredUsersCount } from './siteStats.service.js';

function usersCollection() {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  return adminDb.collection('users');
}

export async function getUserProfile(uid) {
  if (!adminDb) {
    return null;
  }

  const snapshot = await usersCollection().doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

// El listado completo de usuarios lo piden el panel, la gestión de usuarios y el
// catálogo de autores, y cada vez cuesta una lectura por cuenta. Se guarda en
// memoria un minuto y se descarta al crear, cambiar de rol, desactivar, editar o
// borrar una cuenta. Lo único que puede ir algo atrasado es `lastLoginAt`.
const USERS_CACHE_TTL_MS = 60 * 1000;

let usersCache = null; // { users, loadedAt }
let usersInFlight = null;
let usersVersion = 0;

export function invalidateUsersList() {
  usersVersion += 1;
  usersCache = null;
  usersInFlight = null;
}

const MAX_DISPLAY_NAME_LENGTH = 100;

/**
 * El nombre que Google (u otro proveedor) tiene de la cuenta, listo para
 * guardarlo en `nombres`. Va entero ahí y no partido en nombre y apellido:
 * separar "Juan Carlos Pérez Gómez" sería adivinar, y como el resto del sistema
 * une `nombres` y `apellidos` para mostrarlos, el resultado se ve igual.
 *
 * Se quitan `<` y `>` porque el nombre lo elige quien se registra en Google y
 * acaba en listados, comentarios y correos.
 */
export function nombresFromDisplayName(displayName) {
  if (typeof displayName !== 'string') return '';

  return displayName
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DISPLAY_NAME_LENGTH)
    .trim();
}

export async function upsertUserProfile(decodedClaims, additionalData = {}, options = {}) {
  if (!adminDb) {
    return null;
  }

  const { uid, email, name, picture } = decodedClaims;
  const { invitedRole = null } = options;
  const docRef = usersCollection().doc(uid);
  const existing = await docRef.get();
  const preferredRole = getRoleForEmail(email);
  const now = new Date().toISOString();

  const baseProfile = {
    uid,
    email: email || null,
    updatedAt: now,
  };

  if (!existing.exists) {
    // El rol invitado solo manda al crear la cuenta. ADMIN_EMAILS sigue por
    // encima: es la lista de confianza del despliegue y una invitación no debe
    // poder degradar a quien está en ella.
    const initialRole = preferredRole === 'admin'
      ? 'admin'
      : (invitedRole && isValidRole(invitedRole) ? invitedRole : preferredRole || defaultUserRole);

    // El registro con correo manda nombres y apellidos en `additionalData`; el
    // de Google no manda nada, y sin esto la cuenta quedaba sin nombre.
    const googleName = nombresFromDisplayName(name);

    const profile = {
      ...baseProfile,
      photoURL: picture || null,
      ...(googleName ? { nombres: googleName } : {}),
      ...additionalData,
      role: initialRole,
      createdAt: now,
      lastLoginAt: now,
      ...(invitedRole ? { invitedRole, joinedByInvitation: true } : {}),
    };

    await docRef.set(profile);
    invalidateUsersList();
    // La portada muestra esta cifra casi en vivo: sin esto tardaría lo que dure
    // la caché en reflejar el registro.
    invalidateRegisteredUsersCount();
    return profile;
  }

  const currentData = existing.data() || {};

  // Una cuenta desactivada no se reactiva sola al intentar entrar: se devuelve
  // tal cual (sin tocar lastLoginAt) y quien llama decide negar el acceso.
  if (currentData.disabled) {
    return { ...currentData, disabled: true };
  }

  const nextRole = currentData.role === 'admin' || preferredRole === 'admin'
    ? 'admin'
    : currentData.role || defaultUserRole;

  const profile = {
    ...currentData,
    ...baseProfile,
    ...(Object.keys(additionalData).length > 0 && additionalData),
    role: nextRole,
    lastLoginAt: now,
  };

  if (picture) {
    profile.photoURL = picture;
  }

  // Cuentas de Google creadas antes de que se guardara el nombre: se completa
  // al entrar. Solo si de verdad falta, para no pisar un nombre que la persona
  // escribió o editó ella misma.
  if (!String(profile.nombres || '').trim()) {
    const googleName = nombresFromDisplayName(name);
    if (googleName) {
      profile.nombres = googleName;
    }
  }

  await docRef.set(profile, { merge: true });
  return profile;
}

export async function setUserRole(uid, role) {
  if (!adminDb) {
    return null;
  }

  const normalizedRole = isValidRole(role) ? role : defaultUserRole;
  await usersCollection().doc(uid).set({
    role: normalizedRole,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  invalidateUsersList();

  return getUserProfile(uid);
}

/**
 * Alternativa no destructiva a borrar la cuenta: el documento queda intacto
 * (obras, comentarios y autoría siguen en pie) pero se corta el acceso.
 *
 * Hay que cerrar las dos puertas. El flag de Firestore bloquea las peticiones
 * con la cookie de sesión que ya tenga el navegador; deshabilitar la cuenta en
 * Firebase Auth y revocar los refresh tokens impide que vuelva a iniciar sesión
 * o que canjee un idToken viejo por una cookie nueva.
 */
export async function setUserDisabled(uid, disabled) {
  if (!adminDb) {
    return null;
  }

  const now = new Date().toISOString();

  await usersCollection().doc(uid).set({
    disabled,
    disabledAt: disabled ? now : null,
    updatedAt: now,
  }, { merge: true });
  invalidateUsersList();

  if (adminAuth) {
    try {
      await adminAuth.updateUser(uid, { disabled });

      if (disabled) {
        await adminAuth.revokeRefreshTokens(uid);
      }
    } catch (error) {
      // Un perfil puede existir en Firestore sin cuenta en Auth (datos creados
      // a mano). En ese caso el flag de Firestore ya basta para bloquearlo.
      if (error?.code !== 'auth/user-not-found') {
        throw error;
      }
    }
  }

  return getUserProfile(uid);
}

export async function updateUserProfile(uid, updateData) {
  if (!adminDb) {
    return null;
  }

  const now = new Date().toISOString();
  const allowedFields = ['nombres', 'apellidos', 'telefono', 'genero', 'fechaNacimiento', 'photoURL', 'descripcion'];

  const safeUpdate = {};
  for (const key of allowedFields) {
    if (key in updateData && updateData[key] !== undefined && updateData[key] !== null) {
      safeUpdate[key] = updateData[key];
    }
  }

  safeUpdate.updatedAt = now;

  const docRef = usersCollection().doc(uid);
  await docRef.set(safeUpdate, { merge: true });
  invalidateUsersList();

  return getUserProfile(uid);
}

export async function listUsers() {
  if (!adminDb) {
    return [];
  }

  if (usersCache && Date.now() - usersCache.loadedAt < USERS_CACHE_TTL_MS) {
    return usersCache.users;
  }

  // Las peticiones simultáneas comparten una sola consulta. Si se invalida
  // mientras está en vuelo, ese resultado no repone la caché.
  if (!usersInFlight) {
    const startedAt = usersVersion;

    const pending = usersCollection()
      .get()
      .then((snapshot) => {
        const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (startedAt === usersVersion) {
          usersCache = { users, loadedAt: Date.now() };
        }

        return users;
      })
      .finally(() => {
        if (usersInFlight === pending) {
          usersInFlight = null;
        }
      });

    usersInFlight = pending;
  }

  return usersInFlight;
}