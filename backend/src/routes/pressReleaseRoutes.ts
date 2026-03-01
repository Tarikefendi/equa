import { Router, Response } from 'express';
import { PressReleaseController } from '../controllers/pressReleaseController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const pressReleaseController = new PressReleaseController();

// Generate press release for a campaign
router.get('/campaign/:campaignId', authenticate, (req: AuthRequest, res: Response) => 
  pressReleaseController.generatePressRelease(req, res)
);

export default router;
