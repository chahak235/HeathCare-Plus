import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { PasswordResetController } from '../controllers/password-reset.controller';

const router = Router();
const controller = new AuthController();
const passwordReset = new PasswordResetController();

// Public routes
router.post('/signup', controller.signup.bind(controller));
router.post('/login', controller.login.bind(controller));
router.post('/forgot-password', passwordReset.forgot.bind(passwordReset));
router.post('/reset-password', passwordReset.reset.bind(passwordReset));

// Protected route — requires a valid JWT
router.get('/me', authenticate as any, controller.getCurrentUser.bind(controller));

export default router;
