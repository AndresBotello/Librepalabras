import { adminAuth, authSessionMaxAgeMs, firebaseAdminReady } from '../config/firebaseAdmin.js';
import { upsertUserProfile, updateUserProfile } from '../services/user.service.js';
import { invalidateUserCache, primeUserCache } from '../middlewares/auth.middleware.js';

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: authSessionMaxAgeMs,
};

export async function createSession(req, res) {
  try {
    if (!firebaseAdminReady || !adminAuth) {
      return res.status(503).json({
        ok: false,
        message: 'Firebase Admin no está configurado todavía.',
      });
    }

    const { idToken, profile } = req.body;

    if (!idToken) {
      return res.status(400).json({
        ok: false,
        message: 'idToken es obligatorio',
      });
    }

    const decodedClaims = await adminAuth.verifyIdToken(idToken);

    // La cookie del usuario anterior se sobrescribe al asignar la nueva,
    // pero el perfil cacheado en memoria hay que invalidarlo a mano.
    invalidateUserCache(decodedClaims.uid);

    const additionalData = profile ? validateAndSanitizeProfile(profile) : {};

    // Emitir la cookie y escribir el perfil son independientes entre sí:
    // en paralelo el login cuesta un viaje de red menos.
    const [sessionCookie, userProfile] = await Promise.all([
      adminAuth.createSessionCookie(idToken, { expiresIn: authSessionMaxAgeMs }),
      upsertUserProfile(decodedClaims, additionalData),
    ]);

    res.cookie('session', sessionCookie, sessionCookieOptions);

    const responseUser = userProfile || {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      photoURL: decodedClaims.picture || null,
      role: 'collaborator',
    };

    primeUserCache(decodedClaims.uid, responseUser);

    return res.json({
      ok: true,
      message: 'Sesión creada correctamente',
      user: responseUser,
    });
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'No se pudo crear la sesión',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function validateAndSanitizeProfile(profile) {
  const sanitized = {};

  if (profile.nombres && typeof profile.nombres === 'string') {
    sanitized.nombres = profile.nombres.trim().slice(0, 50);
  }

  if (profile.apellidos && typeof profile.apellidos === 'string') {
    sanitized.apellidos = profile.apellidos.trim().slice(0, 50);
  }

  if (profile.telefono && typeof profile.telefono === 'string') {
    const cleanPhone = profile.telefono.replace(/\D/g, '');
    if (/^\d{7,15}$/.test(cleanPhone)) {
      sanitized.telefono = `+57${cleanPhone}`;
    }
  }

  if (profile.fechaNacimiento && typeof profile.fechaNacimiento === 'string') {
    const date = new Date(profile.fechaNacimiento);
    if (!isNaN(date.getTime()) && date < new Date()) {
      sanitized.fechaNacimiento = profile.fechaNacimiento;
    }
  }

  if (typeof profile.edad === 'number' && profile.edad >= 13 && profile.edad <= 120) {
    sanitized.edad = profile.edad;
  }

  if (profile.genero && ['masculino', 'femenino', 'otro'].includes(profile.genero)) {
    sanitized.genero = profile.genero;
  }

  if (profile.photoURL && typeof profile.photoURL === 'string') {
    sanitized.photoURL = profile.photoURL.trim();
  }

  if (profile.descripcion && typeof profile.descripcion === 'string') {
    sanitized.descripcion = profile.descripcion.trim().slice(0, 500);
  }

  return sanitized;
}

export async function getCurrentUser(req, res) {
  return res.json({
    ok: true,
    user: req.user,
  });
}

export async function logout(req, res) {
  res.clearCookie('session', sessionCookieOptions);
  invalidateUserCache(req.auth?.uid);

  return res.json({
    ok: true,
    message: 'Sesión cerrada correctamente',
  });
}

export async function updateProfile(req, res) {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        ok: false,
        message: 'No autorizado',
      });
    }

    const { uid } = req.user;
    const updateData = validateAndSanitizeProfile(req.body);

    const updatedUser = await updateUserProfile(uid, updateData);
    invalidateUserCache(uid);

    return res.json({
      ok: true,
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar el perfil',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}