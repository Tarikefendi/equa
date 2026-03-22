import { Router, Response } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const notificationController = new NotificationController();

// Get user notifications
router.get('/', authenticate, (req: AuthRequest, res: Response) => notificationController.getNotifications(req, res));

// Get unread count
router.get('/unread-count', authenticate, (req: AuthRequest, res: Response) => notificationController.getUnreadCount(req, res));

// Mark all as read (must be before /:id/read to avoid route conflict)
router.put('/read-all', authenticate, (req: AuthRequest, res: Response) => notificationController.markAllAsRead(req, res));

// Mark notification as read
router.put('/:id/read', authenticate, (req: AuthRequest, res: Response) => notificationController.markAsRead(req, res));

// Delete notification
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => notificationController.deleteNotification(req, res));

export default router;
