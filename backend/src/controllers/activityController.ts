import { Response } from 'express';
import { ActivityService } from '../services/activityService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const activityService = new ActivityService();

export class ActivityController {
  async getUserActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const activities = await activityService.getUserActivities(req.user.id, limit);

      res.status(200).json({
        success: true,
        message: 'User activities retrieved successfully',
        data: activities,
      });
    } catch (error) {
      logger.error('Get user activities error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get activities',
      });
    }
  }

  async getActivityFeed(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const activities = await activityService.getActivityFeed(limit);

      res.status(200).json({
        success: true,
        message: 'Activity feed retrieved successfully',
        data: activities,
      });
    } catch (error) {
      logger.error('Get activity feed error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get activity feed',
      });
    }
  }

  async getEntityActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;

      const activities = await activityService.getEntityActivities(entityType, entityId);

      res.status(200).json({
        success: true,
        message: 'Entity activities retrieved successfully',
        data: activities,
      });
    } catch (error) {
      logger.error('Get entity activities error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get entity activities',
      });
    }
  }
}
