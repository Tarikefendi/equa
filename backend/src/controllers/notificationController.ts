import { Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { AuthRequest } from '../types';
import logger from '../config/logger';

const notificationService = new NotificationService();

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const unreadOnly = req.query.unread === 'true';

      const notifications = await notificationService.getUserNotifications(req.user.id, unreadOnly);

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: notifications,
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get notifications',
      });
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await notificationService.markAsRead(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark as read',
      });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await notificationService.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Mark all as read error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark all as read',
      });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await notificationService.getUnreadCount(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get unread count',
      });
    }
  }

  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { id } = req.params;

      const result = await notificationService.deleteNotification(id, req.user.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Delete notification error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete notification',
      });
    }
  }
}
