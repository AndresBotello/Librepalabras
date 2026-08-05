import { Router } from 'express';
import { createStory } from '../controllers/story.controller.js';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles, AUTHOR_ROLES } from '../middlewares/role.middleware.js';

const router = Router();

router.post('/', authenticateRequest, authorizeRoles(AUTHOR_ROLES), createStory);

export default router;