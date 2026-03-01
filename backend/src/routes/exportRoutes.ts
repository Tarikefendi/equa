import { Router, Response } from 'express';
import { ExportController } from '../controllers/exportController';
import { authenticate } from '../middleware/auth';
import { requireModerator } from '../middleware/roleCheck';
import { AuthRequest } from '../types';

const router = Router();
const exportController = new ExportController();

// Export user's own data (GDPR compliance)
router.get('/my-data', authenticate, (req: AuthRequest, res: Response) => exportController.exportUserData(req, res));

// Export campaign data
router.get('/campaign/:campaignId', (req: AuthRequest, res: Response) => exportController.exportCampaignData(req, res));

// Export campaigns to CSV (moderator only)
router.get('/campaigns/csv', authenticate, requireModerator, (req: AuthRequest, res: Response) => exportController.exportCampaignsCSV(req, res));

// Export campaign votes to CSV
router.get('/campaign/:campaignId/votes/csv', (req: AuthRequest, res: Response) => exportController.exportVotesCSV(req, res));

export default router;
