import rateLimit from 'express-rate-limit';

export const commentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 comentarios por IP
  message: 'Demasiados comentarios. Intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No limitar a admins
    return req.user?.role === 'admin';
  },
});

// Las subidas son caras (ancho de banda + cuota de Cloudinary). A diferencia de
// los otros limitadores, este NO exime a los admins: subir es justamente una
// acción de admin, eximirlos lo dejaría sin efecto.
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // holgado para una tanda de ediciones, corta un bucle abusivo
  message: 'Demasiadas subidas seguidas. Espera unos minutos e intenta de nuevo.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Inscribir un cuento es una acción única por colaborador; el límite existe
// para cortar intentos automatizados, no para estorbar a quien participa.
export const contestSubmissionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: 'Demasiados intentos de inscripción. Intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const likeRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 likes por IP en 1 minuto
  message: 'Demasiadas acciones. Intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No limitar a admins
    return req.user?.role === 'admin';
  },
});
