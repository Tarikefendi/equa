import { Router, Response } from 'express';
import { body } from 'express-validator';
import { VoteController } from '../controllers/voteController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const voteController = new VoteController();

// Cast or update vote
router.post(
  '/',
  authenticate,
  [
    body('campaign_id').notEmpty().withMessage('Campaign ID is required'),
    body('vote_choice').isIn(['support', 'oppose', 'neutral']).withMessage('Vote choice must be support, oppose, or neutral'),
  ],
  (req: AuthRequest, res: Response) => voteController.castVote(req, res)
);

// Remove vote
router.delete('/campaign/:campaignId', authenticate, (req: AuthRequest, res: Response) => voteController.removeVote(req, res));

// Get vote statistics for a campaign
router.get('/campaign/:campaignId/stats', (req: AuthRequest, res: Response) => voteController.getVoteStats(req, res));

// Get current user's vote for a campaign
router.get('/campaign/:campaignId/my-vote', authenticate, (req: AuthRequest, res: Response) => voteController.getUserVote(req, res));

// Get all voters for a campaign
router.get('/campaign/:campaignId/voters', (req: AuthRequest, res: Response) => voteController.getCampaignVoters(req, res));

export default router;
