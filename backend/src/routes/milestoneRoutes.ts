import { Router, Response } from 'express';
import { MilestoneController } from '../controllers/milestoneController';
import { AuthRequest } from '../types';

const router = Router();
const milestoneController = new MilestoneController();

router.get('/campaign/:campaignId', (req: AuthRequest, res: Response) => milestoneController.getMilestoneInfo(req, res));

export default router;
