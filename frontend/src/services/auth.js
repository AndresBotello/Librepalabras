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

async function syncSession(user, profileData = null) {
  const idToken = await user.getIdToken(true);
  const payload = { idToken };

  if (profileData) {
    payload.profile = profileData;
  }

  await createSession(payload);
  return user;
}

async function setAuthPersistence(rememberMe) {
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
}

export async function loginWithEmail(email, password, rememberMe = false) {
  await setAuthPersistence(rememberMe);
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return syncSession(credentials.user);
}

export async function registerWithEmail(email, password, profileData = {}, rememberMe = false) {
  await setAuthPersistence(rememberMe);
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  return syncSession(credentials.user, profileData);
}

export async function loginWithGoogle(rememberMe = false) {
  await setAuthPersistence(rememberMe);
  const credentials = await signInWithPopup(auth, googleProvider);
  return syncSession(credentials.user);
}

export async function logoutUser() {
  await Promise.all([
    signOut(auth),
    logoutSession(),
  ]);
}