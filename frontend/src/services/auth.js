import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
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
  'auth/requires-recent-login': 'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar tu contraseña.',
  'auth/provider-already-linked': 'Tu cuenta ya tiene una contraseña configurada.',
  'auth/credential-already-in-use': 'Ese correo ya está asociado a otra cuenta.',
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

async function syncSession(user, profileData = null, inviteToken = null) {
  // Sin `true`: el token acaba de emitirse al iniciar sesión, forzar el refresco
  // agrega un viaje extra a securetoken.googleapis.com sin ningún beneficio.
  const idToken = await user.getIdToken();
  const payload = { idToken };

  if (profileData) {
    payload.profile = profileData;
  }

  // El backend contrasta el token de invitación contra el correo ya verificado
  // por Firebase antes de aplicar el rol: aquí solo lo transportamos.
  if (inviteToken) {
    payload.inviteToken = inviteToken;
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

export async function registerWithEmail(email, password, profileData = {}, rememberMe = false, inviteToken = null) {
  return withFriendlyErrors(async () => {
    await setAuthPersistence(rememberMe);
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    return syncSession(credentials.user, profileData, inviteToken);
  });
}

export async function loginWithGoogle(rememberMe = false, inviteToken = null) {
  return withFriendlyErrors(async () => {
    await setAuthPersistence(rememberMe);
    const credentials = await signInWithPopup(auth, googleProvider);
    return syncSession(credentials.user, null, inviteToken);
  });
}

/**
 * Envía el correo con el enlace para poner una contraseña nueva.
 *
 * Que el correo no esté registrado no se trata como error: si respondiéramos
 * distinto según exista o no la cuenta, el formulario se convertiría en una
 * herramienta para averiguar qué direcciones están dadas de alta. Quien lo usa
 * ve siempre el mismo mensaje.
 *
 * Sirve también para las cuentas que se quedaron solo con Google: al fijar la
 * contraseña, Firebase vuelve a añadir el acceso por correo a esa misma cuenta.
 */
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return;
    }

    throw translateAuthError(error);
  }
}

/* ------------------------------------------------------------------------- *
 * Gestión de la contraseña de la cuenta
 *
 * Todo lo de aquí lo ejecuta el SDK de Firebase directamente contra sus
 * servidores: la contraseña nunca pasa por nuestro backend ni se guarda en
 * ningún estado compartido. Y ninguna de estas operaciones se completa sin una
 * prueba de identidad reciente, para que encontrar una sesión abierta no baste
 * para apropiarse de la cuenta.
 * ------------------------------------------------------------------------- */

export const PASSWORD_PROVIDER = 'password';
export const GOOGLE_PROVIDER = 'google.com';

const SESSION_EXPIRED =
  'Tu sesión de Firebase expiró. Cierra sesión y vuelve a entrar para gestionar tu contraseña.';

/**
 * La sesión de la app vive en una cookie del backend, pero estas operaciones
 * necesitan `auth.currentUser`, que el SDK restaura de forma asíncrona al
 * cargar la página. Sin esperarlo, entrar directo al perfil daría "sesión
 * expirada" aunque la sesión esté perfectamente viva.
 */
function waitForCurrentUser() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribe();
      resolve(currentUser);
    });
  });
}

/**
 * Métodos de acceso que tiene la cuenta ahora mismo. Es lo que decide si al
 * usuario le toca *cambiar* su contraseña o *añadir* una, que es el caso de
 * quien entró con Google y nunca tuvo.
 */
export async function getAccountProviders() {
  const currentUser = await waitForCurrentUser();

  if (!currentUser) {
    return { ready: false, hasPassword: false, hasGoogle: false };
  }

  const providerIds = currentUser.providerData.map((provider) => provider.providerId);

  return {
    ready: true,
    hasPassword: providerIds.includes(PASSWORD_PROVIDER),
    hasGoogle: providerIds.includes(GOOGLE_PROVIDER),
  };
}

export async function changePassword(currentPassword, newPassword) {
  return withFriendlyErrors(async () => {
    const currentUser = await waitForCurrentUser();

    if (!currentUser) {
      throw new Error(SESSION_EXPIRED);
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);

    try {
      await reauthenticateWithCredential(currentUser, credential);
    } catch (error) {
      // El mensaje compartido habla de "correo o contraseña", pero aquí el
      // correo no se pide: sería desorientador.
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        throw new Error('La contraseña actual no es correcta.', { cause: error });
      }

      throw error;
    }

    await updatePassword(currentUser, newPassword);
  });
}

/**
 * Añade una contraseña a una cuenta que solo entraba con Google. Vincula el
 * método al mismo uid en vez de crear una cuenta nueva, así que el perfil y las
 * obras quedan intactos. Volver a pasar por Google es la prueba de identidad:
 * sin ella, cualquiera con acceso al equipo podría fijarse una contraseña y
 * quedarse con la cuenta.
 */
export async function addPasswordToAccount(newPassword) {
  return withFriendlyErrors(async () => {
    const currentUser = await waitForCurrentUser();

    if (!currentUser) {
      throw new Error(SESSION_EXPIRED);
    }

    if (!currentUser.email) {
      throw new Error('Tu cuenta no tiene un correo asociado.');
    }

    const credential = EmailAuthProvider.credential(currentUser.email, newPassword);

    try {
      await linkWithCredential(currentUser, credential);
    } catch (error) {
      if (error?.code !== 'auth/requires-recent-login') {
        throw error;
      }

      await reauthenticateWithPopup(currentUser, googleProvider);
      await linkWithCredential(currentUser, credential);
    }
  });
}

export async function logoutUser() {
  await Promise.all([
    signOut(auth),
    logoutSession(),
  ]);
}