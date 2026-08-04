import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import storyRoutes from './routes/story.routes.js';
import adminRoutes from './routes/admin.routes.js';
import literatureRoutes from './routes/literature.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import promotionalBooksRoutes from './routes/promotionalBooks.routes.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 1 ? allowedOrigins : allowedOrigins[0],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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

app.post('/test-upload', (req, res) => {
  console.log('POST /test-upload called');
  res.json({ ok: true, message: 'Test upload works' });
});

app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/literature', literatureRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/promotional-books', promotionalBooksRoutes);

console.log('✓ Rutas registradas correctamente');

export default app;