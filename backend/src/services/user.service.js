import { adminAuth, adminDb, defaultUserRole, getRoleForEmail, isValidRole } from '../config/firebaseAdmin.js';

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

export async function upsertUserProfile(decodedClaims, additionalData = {}) {
  if (!adminDb) {
    return null;
  }

  const { uid, email, name, picture } = decodedClaims;
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
    const profile = {
      ...baseProfile,
      photoURL: picture || null,
      ...additionalData,
      role: preferredRole || defaultUserRole,
      createdAt: now,
      lastLoginAt: now,
    };

    await docRef.set(profile);
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

  return getUserProfile(uid);
}

export async function listUsers() {
  if (!adminDb) {
    return [];
  }

  const snapshot = await usersCollection().get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}