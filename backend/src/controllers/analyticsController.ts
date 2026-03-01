import { Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getPlatformStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getPlatformStats();

      res.status(200).json({
        success: true,
        message: 'Platform statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Get platform stats error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get statistics',
      });
    }
  }

  async getCampaignAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const analytics = await analyticsService.getCampaignAnalytics(campaignId);

      res.status(200).json({
        success: true,
        message: 'Campaign analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      logger.error('Get campaign analytics error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get analytics',
      });
    }
  }

  async getUserAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const analytics = await analyticsService.getUserAnalytics(userId);

      res.status(200).json({
        success: true,
        message: 'User analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      logger.error('Get user analytics error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get analytics',
      });
    }
  }

  async getMyAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const analytics = await analyticsService.getUserAnalytics(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Your analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      logger.error('Get my analytics error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get analytics',
      });
    }
  }

  async getTrendingCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const campaigns = await analyticsService.getTrendingCampaigns(limit);

      res.status(200).json({
        success: true,
        message: 'Trending campaigns retrieved successfully',
        data: campaigns,
      });
    } catch (error) {
      logger.error('Get trending campaigns error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get trending campaigns',
      });
    }
  }

  async getCategoryStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getCategoryStats();

      res.status(200).json({
        success: true,
        message: 'Category statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Get category stats error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get category statistics',
      });
    }
  }
}
