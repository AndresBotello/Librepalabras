import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import storyRoutes from './routes/story.routes.js';
import adminRoutes from './routes/admin.routes.js';
import literatureRoutes from './routes/literature.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import promotionalBooksRoutes from './routes/promotionalBooks.routes.js';
import poliversiaRoutes from './routes/poliversia.routes.js';
import contestRoutes from './routes/contest.routes.js';

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// En producción el backend vive detrás del proxy del hosting (Render, Railway,
// Fly…). Sin esto `req.ip` es la IP del proxy, la misma para todo el mundo, y
// los rate limiters cuentan a todos los visitantes en un solo cubo: bastaría
// con 10 comentarios en total para bloquear el sitio entero.
if (isProduction) {
  app.set('trust proxy', 1);
}

// Rate Limiting Global (desactivado en desarrollo para no estorbar)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // una SPA hace muchas peticiones por sesión
  message: 'Demasiadas solicitudes, intenta de nuevo más tarde.',
  skip: () => !isProduction,
});

// Rate Limiting más estricto para intentos fallidos de login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  skip: () => !isProduction,
});

const configuredOrigins = process.env.CORS_ORIGIN || process.env.CLIENT_URL;

// En producción, quedarse con el localhost por defecto significa que el
// frontend desplegado recibe errores de CORS en cada petición sin ninguna
// pista en los logs. Mejor no arrancar que arrancar roto.
if (isProduction && !configuredOrigins) {
  throw new Error('Falta CORS_ORIGIN: define el dominio del frontend desplegado.');
}

const allowedOrigins = (configuredOrigins || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares de compresión y seguridad
app.use(compression()); // Activar Gzip
app.use(globalLimiter); // Rate limiting global
app.use(cors({
  origin: allowedOrigins.length > 1 ? allowedOrigins : allowedOrigins[0],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Nada relacionado con la sesión o datos por usuario puede cachearse.
// Cachear /api/auth/me hace que el navegador sirva el perfil del usuario anterior.
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'Backend de LibrePalabras funcionando',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Rutas con rate limiting más estricto para auth
app.use('/api/auth/session', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/literature', literatureRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/promotional-books', promotionalBooksRoutes);
app.use('/api/poliversia', poliversiaRoutes);
app.use('/api/contest', contestRoutes);

// Una ruta /api inexistente devolvía el HTML de error de Express, que el
// frontend intenta parsear como JSON y acaba en "Unexpected token <".
app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
});

// Último recurso: cualquier error que se escape de un controlador. El detalle
// se queda en los logs del servidor, nunca viaja al navegador en producción.
app.use((error, _req, res, _next) => {
  console.error('Error no controlado:', error);

  res.status(error.status || 500).json({
    ok: false,
    message: isProduction ? 'Error interno del servidor' : error.message,
  });
});

console.log('✓ Rutas registradas correctamente');
console.log('✓ Compresión Gzip habilitada');
console.log(`✓ Rate limiting ${isProduction ? 'habilitado' : 'desactivado (desarrollo)'}`);

export default app;
