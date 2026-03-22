import { Router, Response } from 'express';
import { CampaignController } from '../controllers/campaignController';
import { CampaignUpdateController } from '../controllers/campaignUpdateController';
import { FollowController } from '../controllers/followController';
import { EvidenceController } from '../controllers/evidenceController';
import { CampaignReportController } from '../controllers/campaignReportController';
import { CampaignShareController } from '../controllers/campaignShareController';
import { CampaignClosureController } from '../controllers/campaignClosureController';
import { EvidenceModerationController } from '../controllers/evidenceModerationController';
import { CampaignInvestigationController } from '../controllers/campaignInvestigationController';
import { authenticate, optionalAuth } from '../middleware/auth';

import { body } from 'express-validator';
import { AuthRequest } from '../types';

const router = Router();
const campaignController = new CampaignController();
const campaignUpdateController = new CampaignUpdateController();
const followController = new FollowController();
const evidenceController = new EvidenceController();
const reportController = new CampaignReportController();
const shareController = new CampaignShareController();
const closureController = new CampaignClosureController();
const evidenceModerationController = new EvidenceModerationController();
const investigationController = new CampaignInvestigationController();

const createCampaignValidation = [
  body('title').isLength({ min: 5, max: 500 }).withMessage('Title must be 5-500 characters'),
  body('description').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('target_entity').notEmpty().withMessage('Target entity is required'),
  body('target_type').isIn(['company', 'brand', 'government']).withMessage('Invalid target type'),
  body('category').notEmpty().withMessage('Category is required'),
];

// Public routes (static routes must come before dynamic /:id)
router.get('/', (req: AuthRequest, res: Response) => campaignController.getCampaigns(req, res));
router.get('/trending', (req: AuthRequest, res: Response) => campaignController.getTrendingCampaigns(req, res));
router.get('/similar', (req: AuthRequest, res: Response) => campaignController.getSimilarCampaigns(req, res));
router.get('/search', (req: AuthRequest, res: Response) => campaignController.searchCampaigns(req, res));
router.get('/my/campaigns', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.getMyCampaigns(req, res)
);

router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => campaignController.getCampaignById(req, res));

// Protected routes
router.post('/', authenticate, createCampaignValidation, (req: AuthRequest, res: Response) => 
  campaignController.createCampaign(req, res)
);

router.put('/:id', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.updateCampaign(req, res)
);

router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.deleteCampaign(req, res)
);

router.post('/:id/send-to-organization', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.sendToOrganization(req, res)
);

router.get('/:id/email-history', authenticate, (req: AuthRequest, res: Response) => 
  campaignController.getEmailHistory(req, res)
);

router.patch('/:id/status', authenticate, (req: AuthRequest, res: Response) => campaignController.updateStatus(req, res));
router.get('/:id/status-history', (req: AuthRequest, res: Response) => campaignController.getStatusHistory(req, res));
router.post('/:id/view', optionalAuth, (req: AuthRequest, res: Response) => campaignController.recordView(req, res));

// Campaign updates
router.get('/:id/updates', (req: AuthRequest, res: Response) => campaignUpdateController.getUpdates(req, res));
router.post('/:id/updates', authenticate, (req: AuthRequest, res: Response) => campaignUpdateController.addUpdate(req, res));
router.post('/:id/updates/official-response', authenticate, (req: AuthRequest, res: Response) => campaignUpdateController.addOfficialResponse(req, res));
router.get('/:id/updates/:updateId/history', (req: AuthRequest, res: Response) => campaignUpdateController.getUpdateHistory(req, res));
router.put('/:id/updates/:updateId', authenticate, (req: AuthRequest, res: Response) => campaignUpdateController.editUpdate(req, res));
router.delete('/:id/updates/:updateId', authenticate, (req: AuthRequest, res: Response) => campaignUpdateController.deleteUpdate(req, res));
router.patch('/:id/updates/:updateId/pin', authenticate, (req: AuthRequest, res: Response) => campaignUpdateController.togglePin(req, res));

// Evidence routes
router.get('/:campaignId/evidence', (req: AuthRequest, res: Response) => evidenceController.getEvidence(req, res));
router.get('/:campaignId/evidence/pending', authenticate, (req: AuthRequest, res: Response) => evidenceController.getPendingEvidence(req, res));
router.post('/:campaignId/evidence', authenticate, (req: AuthRequest, res: Response) => evidenceController.addEvidence(req, res));
router.patch('/:campaignId/evidence/:evidenceId/status', authenticate, (req: AuthRequest, res: Response) => evidenceController.updateEvidenceStatus(req, res));
router.delete('/:campaignId/evidence/:evidenceId', authenticate, (req: AuthRequest, res: Response) => evidenceController.deleteEvidence(req, res));
// Evidence moderation routes
router.post('/:campaignId/evidence-summary', (req: AuthRequest, res: Response) => evidenceModerationController.summary(req, res));
router.get('/:campaignId/evidence-summary', (req: AuthRequest, res: Response) => evidenceModerationController.summary(req, res));
router.post('/evidence/:id/approve', authenticate, (req: AuthRequest, res: Response) => evidenceModerationController.approve(req, res));
router.post('/evidence/:id/reject', authenticate, (req: AuthRequest, res: Response) => evidenceModerationController.reject(req, res));
router.post('/evidence/:id/flag', authenticate, (req: AuthRequest, res: Response) => evidenceModerationController.flag(req, res));

// Follow routes
router.get('/:id/follow', optionalAuth, (req: AuthRequest, res: Response) => followController.getStatus(req, res));
router.post('/:id/follow', authenticate, (req: AuthRequest, res: Response) => followController.follow(req, res));
router.delete('/:id/follow', authenticate, (req: AuthRequest, res: Response) => followController.unfollow(req, res));

// Report routes
router.post('/:id/report', authenticate, (req: AuthRequest, res: Response) => reportController.report(req, res));
router.get('/:id/report', optionalAuth, (req: AuthRequest, res: Response) => reportController.getUserReport(req, res));

// Share routes
router.post('/:id/share', optionalAuth, (req: AuthRequest, res: Response) => shareController.recordShare(req, res));
router.get('/:id/share-stats', optionalAuth, (req: AuthRequest, res: Response) => shareController.getShareStats(req, res));

// Impact route
router.get('/:id/impact', optionalAuth, (req: AuthRequest, res: Response) => campaignController.getImpact(req, res));
router.get('/:id/momentum', optionalAuth, (req: AuthRequest, res: Response) => campaignController.getMomentum(req, res));
router.get('/:id/milestone', optionalAuth, (req: AuthRequest, res: Response) => campaignController.getMilestone(req, res));

// Closure routes
router.post('/:id/resolve', authenticate, (req: AuthRequest, res: Response) => closureController.resolveCampaign(req, res));
router.post('/:id/close', authenticate, (req: AuthRequest, res: Response) => closureController.closeCampaign(req, res));
router.get('/:id/victory', optionalAuth, (req: AuthRequest, res: Response) => closureController.getVictory(req, res));

// Investigation mode routes
router.patch('/:id/investigation-mode', authenticate, (req: AuthRequest, res: Response) => investigationController.toggle(req, res));
router.get('/:id/investigation-summary', optionalAuth, (req: AuthRequest, res: Response) => investigationController.summary(req, res));

export default router;