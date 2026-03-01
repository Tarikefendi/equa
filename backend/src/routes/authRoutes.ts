import { Router, Response } from 'express';
import { AuthController } from '../controllers/authController';
import { registerValidation, loginValidation } from '../utils/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { verifyCaptcha } from '../middleware/captcha';
import { AuthRequest } from '../types';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authLimiter, verifyCaptcha('register'), registerValidation, (req: AuthRequest, res: Response) => 
  authController.register(req, res)
);

router.post('/login', authLimiter, verifyCaptcha('login'), loginValidation, (req: AuthRequest, res: Response) => 
  authController.login(req, res)
);

// Protected routes
router.get('/profile', authenticate, (req: AuthRequest, res: Response) => 
  authController.getProfile(req, res)
);

// Email verification routes
router.get('/verify-email', (req: AuthRequest, res: Response) => 
  authController.verifyEmail(req, res)
);

router.post('/resend-verification', authenticate, (req: AuthRequest, res: Response) => 
  authController.resendVerification(req, res)
);

// Password reset routes
router.post('/forgot-password', authLimiter, (req: AuthRequest, res: Response) => 
  authController.forgotPassword(req, res)
);

router.post('/reset-password', authLimiter, (req: AuthRequest, res: Response) => 
  authController.resetPassword(req, res)
);

export default router;
