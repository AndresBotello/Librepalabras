import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { createSession, logoutSession } from './api';

const AUTH_ERROR_MESSAGES = {
  'auth/network-request-failed': 'No hay conexión a internet. Revisa tu red e intenta de nuevo.',
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/wrong-password': 'El correo o la contraseña no son correctos.',
  'auth/user-not-found': 'El correo o la contraseña no son correctos.',
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta al equipo de LibrePalabras.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentar.',
  'auth/email-already-in-use': 'Ya existe una cuenta registrada con este correo.',
  'auth/weak-password': 'La contraseña es muy débil. Usa al menos 6 caracteres.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
  'auth/popup-blocked': 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e intenta de nuevo.',
  'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de terminar.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de acceso.',
  'auth/operation-not-allowed': 'Este método de acceso no está habilitado.',
};

function translateAuthError(error) {
  const friendly = AUTH_ERROR_MESSAGES[error?.code];

  if (friendly) {
    return new Error(friendly);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('No se pudo completar la operación. Intenta de nuevo.');
}

async function withFriendlyErrors(operation) {
  try {
    return await operation();
  } catch (error) {
    throw translateAuthError(error);
  }
}

async function syncSession(user, profileData = null) {
  // Sin `true`: el token acaba de emitirse al iniciar sesión, forzar el refresco
  // agrega un viaje extra a securetoken.googleapis.com sin ningún beneficio.
  const idToken = await user.getIdToken();
  const payload = { idToken };

  if (profileData) {
    payload.profile = profileData;
  }

  // El backend ya devuelve el perfil completo: lo propagamos para no tener que
  // pedirlo otra vez con GET /auth/me.
  const response = await createSession(payload);
  return response?.user || null;
}

async function setAuthPersistence(rememberMe) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
}

export async function loginWithEmail(email, password, rememberMe = false) {
  return withFriendlyErrors(async () => {
    await setAuthPersistence(rememberMe);
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    return syncSession(credentials.user);
  });
}

export async function registerWithEmail(email, password, profileData = {}, rememberMe = false) {
  return withFriendlyErrors(async () => {
    await setAuthPersistence(rememberMe);
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    return syncSession(credentials.user, profileData);
  });
}

export async function loginWithGoogle(rememberMe = false) {
  return withFriendlyErrors(async () => {
    await setAuthPersistence(rememberMe);
    const credentials = await signInWithPopup(auth, googleProvider);
    return syncSession(credentials.user);
  });
}

export async function logoutUser() {
  await Promise.all([
    signOut(auth),
    logoutSession(),
  ]);
}