import { adminAuth, defaultUserRole, firebaseAdminReady } from '../config/firebaseAdmin.js';
import { getUserProfile } from '../services/user.service.js';

const userCache = new Map();
const CACHE_TTL = 30000;

export function invalidateUserCache(uid) {
  if (uid) {
    userCache.delete(uid);
  } else {
    userCache.clear();
  }
}

// Al crear la sesión ya tenemos el perfil recién escrito: guardarlo evita que la
// primera petición autenticada tenga que volver a leer Firestore.
export function primeUserCache(uid, profile) {
  if (!uid || !profile) {
    invalidateUserCache(uid);
    return;
  }

  userCache.set(uid, { data: profile, timestamp: Date.now() });
}

// Resuelve la sesión a partir de la cookie. Lanza si la cookie no es válida.
async function resolveSession(sessionCookie) {
  const now = Date.now();

  // `checkRevoked` obliga a Firebase a consultar el registro del usuario por red
  // en cada petición. Si ya validamos a este usuario hace menos de CACHE_TTL,
  // la verificación criptográfica local basta: una revocación se nota, como
  // mucho, 30 segundos más tarde.
  let decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, false);
  let cached = userCache.get(decodedClaims.uid);
  const cacheHit = cached && now - cached.timestamp < CACHE_TTL;

  if (!cacheHit) {
    decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  }

  const userProfile = cacheHit
    ? cached.data
    : await getUserProfile(decodedClaims.uid);

  if (!cacheHit) {
    userCache.set(decodedClaims.uid, { data: userProfile, timestamp: now });
  }

  return {
    auth: decodedClaims,
    // Sin perfil en Firestore se asume el rol más bajo: si esta suposición se
    // equivoca, el peor caso es negar permisos de más, nunca concederlos.
    user: userProfile || {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      photoURL: decodedClaims.picture || null,
      role: defaultUserRole,
    },
  };
}

export async function authenticateRequest(req, res, next) {
  try {
    if (!firebaseAdminReady || !adminAuth) {
      return res.status(503).json({
        ok: false,
        message: 'Firebase Admin no está configurado todavía.',
      });
    }

    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      return res.status(401).json({
        ok: false,
        message: 'No hay sesión activa',
      });
    }

    const session = await resolveSession(sessionCookie);

    // La cookie sigue siendo criptográficamente válida hasta que caduque, así
    // que el corte de acceso de una cuenta desactivada se aplica aquí.
    if (session.user?.disabled) {
      return res.status(403).json({
        ok: false,
        message: 'Tu cuenta está desactivada. Contacta con un administrador.',
        code: 'account-disabled',
      });
    }

    req.auth = session.auth;
    req.user = session.user;

    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Sesión inválida o expirada',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function attachUserIfPresent(req, res, next) {
  req.auth = null;
  req.user = null;

  try {
    if (firebaseAdminReady && adminAuth && req.cookies.session) {
      const session = await resolveSession(req.cookies.session);

      // Una cuenta desactivada se trata como visitante anónimo en las rutas
      // públicas: ve el contenido abierto, pero nada le cuenta como suyo.
      if (!session.user?.disabled) {
        req.auth = session.auth;
        req.user = session.user;
      }
    }
  } catch {
    req.auth = null;
    req.user = null;
  }

  return next();
}