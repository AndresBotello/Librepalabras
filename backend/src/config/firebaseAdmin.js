import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

  const absolutePath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(process.cwd(), keyPath);

  const raw = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw);
}

const serviceAccount = loadServiceAccount();
const adminApp = serviceAccount
  ? getApps().length > 0
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) })
  : null;

export const firebaseAdminReady = Boolean(adminApp);
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const authSessionMaxAgeMs = Number(process.env.AUTH_SESSION_MAX_AGE_MS || 5 * 24 * 60 * 60 * 1000);
export const defaultUserRole = 'collaborator';
export const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function getRoleForEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  return adminEmails.includes(normalizedEmail) ? 'admin' : 'collaborator';
}