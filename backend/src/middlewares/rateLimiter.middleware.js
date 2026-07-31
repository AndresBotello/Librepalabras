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
