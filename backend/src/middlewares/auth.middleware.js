import { adminAuth, firebaseAdminReady } from '../config/firebaseAdmin.js';
import { getUserProfile } from '../services/user.service.js';

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

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userProfile = await getUserProfile(decodedClaims.uid);

    req.auth = decodedClaims;
    req.user = userProfile || {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      photoURL: decodedClaims.picture || null,
      role: 'collaborator',
    };

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
  try {
    if (!firebaseAdminReady || !adminAuth) {
      req.auth = null;
      req.user = null;
      return next();
    }

    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      req.auth = null;
      req.user = null;
      return next();
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userProfile = await getUserProfile(decodedClaims.uid);

    req.auth = decodedClaims;
    req.user = userProfile || {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      photoURL: decodedClaims.picture || null,
      role: 'collaborator',
    };
  } catch (error) {
    req.auth = null;
    req.user = null;
  }

  return next();
}