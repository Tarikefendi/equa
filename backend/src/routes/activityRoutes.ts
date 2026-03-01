import { Router, Response } from 'express';
import { ActivityController } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const activityController = new ActivityController();

// Get activity feed (public)
router.get('/feed', (req: AuthRequest, res: Response) => activityController.getActivityFeed(req, res));

// Get user's own activities
router.get('/my-activities', authenticate, (req: AuthRequest, res: Response) => activityController.getUserActivities(req, res));

// Get activities for a specific entity
router.get('/entity/:entityType/:entityId', (req: AuthRequest, res: Response) => activityController.getEntityActivities(req, res));

export default router;
