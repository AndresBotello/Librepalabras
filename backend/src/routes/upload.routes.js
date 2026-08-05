import { Router } from 'express';
import multer from 'multer';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { uploadRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  uploadCover,
  uploadProfilePhoto,
  uploadLiteraryPdf,
  uploadMagazinePdf,
} from '../controllers/upload.controller.js';
import { MAX_PDF_BYTES, formatBytes } from '../utils/files.js';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Multer corta la petición en cuanto se pasa del límite, así el servidor no
// llega a cargar en memoria un archivo que de todos modos íbamos a rechazar.
const uploadMagazine = multer({ storage, limits: { fileSize: MAX_PDF_BYTES } });

router.post('/cover', authenticateRequest, upload.single('file'), uploadCover);
router.post('/profile-photo', authenticateRequest, upload.single('file'), uploadProfilePhoto);
router.post('/pdf', authenticateRequest, upload.single('file'), uploadLiteraryPdf);

router.post(
  '/magazine-pdf',
  authenticateRequest,
  authorizeRoles(['admin']),
  uploadRateLimiter,
  uploadMagazine.single('file'),
  uploadMagazinePdf
);

// Sin esto, pasarse del límite devuelve el error genérico de Express en HTML.
router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `El archivo supera el límite de ${formatBytes(MAX_PDF_BYTES)}`
      : 'No se pudo procesar el archivo';

    return res.status(400).json({ ok: false, message });
  }

  return next(error);
});

export default router;
