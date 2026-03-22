import { Response } from 'express';
import { MilestoneService } from '../services/milestoneService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const milestoneService = new MilestoneService();

export class MilestoneController {
  async getMilestoneInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const data = await milestoneService.getMilestoneInfo(campaignId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error('Get milestone info error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get milestone info',
      });
    }
  }
}
