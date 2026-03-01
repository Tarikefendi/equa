import { Response } from 'express';
import { CampaignStatusService } from '../services/campaignStatusService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const campaignStatusService = new CampaignStatusService();

export class CampaignStatusController {
  async createStatusUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;
      const { statusType, title, description, documents, isMilestone } = req.body;

      if (!statusType || !title) {
        res.status(400).json({
          success: false,
          message: 'Status type and title are required',
        });
        return;
      }

      const statusUpdate = await campaignStatusService.createStatusUpdate({
        campaignId,
        userId: req.user.id,
        statusType,
        title,
        description,
        documents,
        isMilestone,
      });

      res.status(201).json({
        success: true,
        message: 'Status update created successfully',
        data: statusUpdate,
      });
    } catch (error) {
      logger.error('Create status update error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create status update',
      });
    }
  }

  async getStatusUpdates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const updates = await campaignStatusService.getStatusUpdates(campaignId);

      res.status(200).json({
        success: true,
        message: 'Status updates retrieved successfully',
        data: updates,
      });
    } catch (error) {
      logger.error('Get status updates error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get status updates',
      });
    }
  }

  async deleteStatusUpdate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { updateId } = req.params;

      await campaignStatusService.deleteStatusUpdate(updateId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Status update deleted successfully',
      });
    } catch (error) {
      logger.error('Delete status update error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete status update',
      });
    }
  }
}
