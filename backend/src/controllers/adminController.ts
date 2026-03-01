import { Response } from 'express';
import { AdminService } from '../services/adminService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const adminService = new AdminService();

export class AdminController {
  async getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();

      res.status(200).json({
        success: true,
        message: 'Dashboard stats retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get stats',
      });
    }
  }

  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        role: req.query.role as string,
        verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const users = await adminService.getAllUsers(filters);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get users',
      });
    }
  }

  async updateUserRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'moderator', 'admin'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
        return;
      }

      const result = await adminService.updateUserRole(userId, role);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update role',
      });
    }
  }

  async banUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Reason is required',
        });
        return;
      }

      const result = await adminService.banUser(userId, reason, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Ban user error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to ban user',
      });
    }
  }

  async getPendingCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const campaigns = await adminService.getPendingCampaigns(limit);

      res.status(200).json({
        success: true,
        message: 'Pending campaigns retrieved successfully',
        data: campaigns,
      });
    } catch (error) {
      logger.error('Get pending campaigns error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get campaigns',
      });
    }
  }

  async approveCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;
      const result = await adminService.approveCampaign(campaignId, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Approve campaign error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve campaign',
      });
    }
  }

  async rejectCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Reason is required',
        });
        return;
      }

      const result = await adminService.rejectCampaign(campaignId, reason, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Reject campaign error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject campaign',
      });
    }
  }

  async deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { campaignId } = req.params;
      const result = await adminService.deleteCampaign(campaignId, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Delete campaign error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete campaign',
      });
    }
  }

  async getPendingReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const reports = await adminService.getPendingReports(limit);

      res.status(200).json({
        success: true,
        message: 'Pending reports retrieved successfully',
        data: reports,
      });
    } catch (error) {
      logger.error('Get pending reports error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get reports',
      });
    }
  }

  async updateReportStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { reportId } = req.params;
      const { status, resolution } = req.body;

      if (!['reviewing', 'resolved', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
        return;
      }

      const result = await adminService.updateReportStatus(reportId, status, resolution, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Update report status error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update report',
      });
    }
  }

  async getRecentActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const activities = await adminService.getRecentActivity(limit);

      res.status(200).json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data: activities,
      });
    } catch (error) {
      logger.error('Get recent activity error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get activity',
      });
    }
  }

  async getSystemHealth(req: AuthRequest, res: Response): Promise<void> {
    try {
      const health = await adminService.getSystemHealth();

      res.status(200).json({
        success: true,
        message: 'System health retrieved successfully',
        data: health,
      });
    } catch (error) {
      logger.error('Get system health error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get health',
      });
    }
  }

  // Lawyer Management
  async getPendingLawyers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const lawyers = await adminService.getPendingLawyers();

      res.status(200).json({
        success: true,
        message: 'Pending lawyers retrieved successfully',
        data: lawyers,
      });
    } catch (error) {
      logger.error('Get pending lawyers error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get lawyers',
      });
    }
  }

  async verifyLawyer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lawyerId } = req.params;

      const result = await adminService.verifyLawyer(lawyerId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Verify lawyer error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify lawyer',
      });
    }
  }

  async rejectLawyer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lawyerId } = req.params;

      const result = await adminService.rejectLawyer(lawyerId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Reject lawyer error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject lawyer',
      });
    }
  }
}
