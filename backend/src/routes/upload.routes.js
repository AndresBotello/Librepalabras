import { Router } from 'express';
import multer from 'multer';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { uploadCover, uploadProfilePhoto, uploadLiteraryPdf } from '../controllers/upload.controller.js';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/cover', authenticateRequest, upload.single('file'), uploadCover);
router.post('/profile-photo', authenticateRequest, upload.single('file'), uploadProfilePhoto);
router.post('/pdf', authenticateRequest, upload.single('file'), uploadLiteraryPdf);

export default router;
