import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/signup', controller.signup.bind(controller));
router.post('/login', controller.login.bind(controller));

// Protected route — requires a valid JWT
router.get('/me', authenticate as any, controller.getCurrentUser.bind(controller));

export default router;
