import { adminDb, defaultUserRole, getRoleForEmail } from '../config/firebaseAdmin.js';

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
    photoURL: picture || null,
    updatedAt: now,
  };

  if (!existing.exists) {
    const profile = {
      ...baseProfile,
      ...additionalData,
      role: preferredRole || defaultUserRole,
      createdAt: now,
      lastLoginAt: now,
    };

    await docRef.set(profile);
    return profile;
  }

  const currentData = existing.data() || {};
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

  await docRef.set(profile, { merge: true });
  return profile;
}

export async function setUserRole(uid, role) {
  if (!adminDb) {
    return null;
  }

  const normalizedRole = role === 'admin' ? 'admin' : 'collaborator';
  await usersCollection().doc(uid).set({
    role: normalizedRole,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

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