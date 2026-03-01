import { Router, Response } from 'express';
import { CampaignStatusController } from '../controllers/campaignStatusController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const campaignStatusController = new CampaignStatusController();

// Get status updates for a campaign (public)
router.get('/campaign/:campaignId', (req: AuthRequest, res: Response) =>
  campaignStatusController.getStatusUpdates(req, res)
);

// Create status update (authenticated, campaign creator only)
router.post('/campaign/:campaignId', authenticate, (req: AuthRequest, res: Response) =>
  campaignStatusController.createStatusUpdate(req, res)
);

// Delete status update (authenticated, creator only)
router.delete('/:updateId', authenticate, (req: AuthRequest, res: Response) =>
  campaignStatusController.deleteStatusUpdate(req, res)
);

export default router;
