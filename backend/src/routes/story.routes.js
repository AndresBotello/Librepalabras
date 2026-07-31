import { Router } from 'express';
import { createStory } from '../controllers/story.controller.js';
import { authenticateRequest } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.post('/', authenticateRequest, authorizeRoles(['admin', 'collaborator']), createStory);

export default router;