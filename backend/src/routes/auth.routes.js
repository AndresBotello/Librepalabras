import { Router } from 'express';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { createSession, getCurrentUser, logout, updateProfile, verifyCaptcha } from '../controllers/auth.controller.js';

const router = Router();

router.post('/session', createSession);
router.post('/verify-captcha', verifyCaptcha);
router.get('/me', authenticateRequest, getCurrentUser);
router.post('/logout', authenticateRequest, logout);
router.patch('/profile', authenticateRequest, updateProfile);

export default router;