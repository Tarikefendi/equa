import { Router, Response } from 'express';
import { body } from 'express-validator';
import { MilestoneController } from '../controllers/milestoneController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const milestoneController = new MilestoneController();

// Create milestone
router.post(
  '/',
  authenticate,
  [
    body('campaign_id').notEmpty().withMessage('Campaign ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('target_value').isInt({ min: 1 }).withMessage('Target value must be a positive integer'),
    body('description').optional().isString(),
  ],
  (req: AuthRequest, res: Response) => milestoneController.createMilestone(req, res)
);

// Get campaign milestones
router.get('/campaign/:campaignId', (req: AuthRequest, res: Response) => milestoneController.getCampaignMilestones(req, res));

// Update milestone progress
router.put('/:id/progress', authenticate, (req: AuthRequest, res: Response) => milestoneController.updateMilestoneProgress(req, res));

// Delete milestone
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => milestoneController.deleteMilestone(req, res));

export default router;
