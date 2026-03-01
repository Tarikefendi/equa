import { Router, Response } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const analyticsController = new AnalyticsController();

// Platform statistics
router.get('/platform', (req: AuthRequest, res: Response) => analyticsController.getPlatformStats(req, res));

// Campaign analytics
router.get('/campaign/:campaignId', (req: AuthRequest, res: Response) => analyticsController.getCampaignAnalytics(req, res));

// User analytics
router.get('/user/:userId', (req: AuthRequest, res: Response) => analyticsController.getUserAnalytics(req, res));

// My analytics
router.get('/my-analytics', authenticate, (req: AuthRequest, res: Response) => analyticsController.getMyAnalytics(req, res));

// Trending campaigns
router.get('/trending', (req: AuthRequest, res: Response) => analyticsController.getTrendingCampaigns(req, res));

// Category statistics
router.get('/categories', (req: AuthRequest, res: Response) => analyticsController.getCategoryStats(req, res));

export default router;
