import { Router } from 'express';
import { searchRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { searchContent } from '../controllers/search.controller.js';

const router = Router();

router.get('/', searchRateLimiter, searchContent);

export default router;
