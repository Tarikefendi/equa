import { Response } from 'express';
import { validationResult } from 'express-validator';
import { MilestoneService } from '../services/milestoneService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const milestoneService = new MilestoneService();

export class MilestoneController {
  async createMilestone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const milestone = await milestoneService.createMilestone(req.body);

      res.status(201).json({
        success: true,
        message: 'Milestone created successfully',
        data: milestone,
      });
    } catch (error) {
      logger.error('Create milestone error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create milestone',
      });
    }
  }

  async getCampaignMilestones(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const milestones = await milestoneService.getCampaignMilestones(campaignId);

      res.status(200).json({
        success: true,
        message: 'Campaign milestones retrieved successfully',
        data: milestones,
      });
    } catch (error) {
      logger.error('Get campaign milestones error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get milestones',
      });
    }
  }

  async updateMilestoneProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;
      const { current_value } = req.body;

      if (typeof current_value !== 'number') {
        res.status(400).json({
          success: false,
          message: 'current_value must be a number',
        });
        return;
      }

      const milestone = await milestoneService.updateMilestoneProgress(id, current_value);

      res.status(200).json({
        success: true,
        message: 'Milestone progress updated successfully',
        data: milestone,
      });
    } catch (error) {
      logger.error('Update milestone progress error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update milestone',
      });
    }
  }

  async deleteMilestone(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await milestoneService.deleteMilestone(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Delete milestone error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete milestone',
      });
    }
  }
}
