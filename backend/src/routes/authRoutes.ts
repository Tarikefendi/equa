import { Router, Response } from 'express';
import { AuthController } from '../controllers/authController';
import { registerValidation, loginValidation } from '../utils/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { verifyCaptcha } from '../middleware/captcha';
import { AuthRequest } from '../types';
import { ReputationService } from '../services/reputationService';

const router = Router();
const authController = new AuthController();
const reputationService = new ReputationService();

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

router.patch('/profile', authenticate, (req: AuthRequest, res: Response) =>
  authController.updateProfile(req, res)
);

router.get('/reputation/events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const events = await reputationService.getEvents(req.user!.id);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to get reputation events' });
  }
});

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
