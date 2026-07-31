import { Router } from 'express';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { createSession, getCurrentUser, logout, updateProfile } from '../controllers/auth.controller.js';

const router = Router();

router.post('/session', createSession);
router.get('/me', authenticateRequest, getCurrentUser);
router.post('/logout', authenticateRequest, logout);
router.patch('/profile', authenticateRequest, updateProfile);

export default router;