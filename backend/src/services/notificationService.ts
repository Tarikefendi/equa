import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';

interface CreateNotificationDTO {
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
}

export class NotificationService {
  async createNotification(data: CreateNotificationDTO) {
    const notificationId = randomBytes(16).toString('hex');

    db.prepare(
      `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      notificationId,
      data.user_id,
      data.type,
      data.title,
      data.message,
      data.entity_type || null,
      data.entity_id || null
    );

    logger.info(`Notification created: ${notificationId} for user ${data.user_id}`);

    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId);
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    
    if (unreadOnly) {
      query += ' AND is_read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = db.prepare(query).all(userId);

    return notifications;
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = db.prepare(
      'SELECT user_id FROM notifications WHERE id = ?'
    ).get(notificationId) as any;

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId);

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId);

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(userId) as any;

    return { count: result.count };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = db.prepare(
      'SELECT user_id FROM notifications WHERE id = ?'
    ).get(notificationId) as any;

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);

    return { message: 'Notification deleted' };
  }

  // Helper methods for common notifications
  async notifyNewComment(campaignId: string, campaignCreatorId: string, commenterUsername: string) {
    await this.createNotification({
      user_id: campaignCreatorId,
      type: 'new_comment',
      title: 'New Comment',
      message: `${commenterUsername} commented on your campaign`,
      entity_type: 'campaign',
      entity_id: campaignId,
    });
  }

  async notifyNewVote(campaignId: string, campaignCreatorId: string) {
    await this.createNotification({
      user_id: campaignCreatorId,
      type: 'new_vote',
      title: 'New Vote',
      message: 'Someone voted on your campaign',
      entity_type: 'campaign',
      entity_id: campaignId,
    });
  }

  async notifyCampaignStatusChange(campaignId: string, userId: string, newStatus: string) {
    await this.createNotification({
      user_id: userId,
      type: 'campaign_status',
      title: 'Campaign Status Updated',
      message: `Your campaign status changed to: ${newStatus}`,
      entity_type: 'campaign',
      entity_id: campaignId,
    });
  }
}
