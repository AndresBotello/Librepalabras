import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

/**
 * En despliegue no se sube el serviceAccountKey.json (está en .gitignore), así
 * que la credencial llega por FIREBASE_SERVICE_ACCOUNT_JSON. Si no hay ninguna
 * de las dos, `readFileSync` fallaba con un ENOENT que no dice qué configurar.
 */
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido. Debe ir en una sola línea, con los \\n de la clave privada escapados.'
      );
    }
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

  const absolutePath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(process.cwd(), keyPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `No hay credenciales de Firebase Admin: no existe ${absolutePath}. ` +
        'En el servidor de producción define FIREBASE_SERVICE_ACCOUNT_JSON con el contenido de la clave.'
    );
  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
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

// Roles del sistema. `judge` califica y publica cuentos del concurso, pero no
// puede subir obras ni gestionar la plataforma.
export const VALID_ROLES = ['admin', 'collaborator', 'judge'];

export function isValidRole(role) {
  return VALID_ROLES.includes(role);
}
export const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function getRoleForEmail(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  return adminEmails.includes(normalizedEmail) ? 'admin' : 'collaborator';
}