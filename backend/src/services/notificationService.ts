import pool from '../config/database';
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

    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [notificationId, data.user_id, data.type, data.title, data.message, data.entity_type || null, data.entity_id || null]
    );

    logger.info(`Notification created: ${notificationId} for user ${data.user_id}`);

    const result = await pool.query('SELECT * FROM notifications WHERE id = $1', [notificationId]);
    return result.rows[0];
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    if (unreadOnly) query += ' AND is_read = 0';
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async markAsRead(notificationId: string, userId: string) {
    const result = await pool.query('SELECT user_id FROM notifications WHERE id = $1', [notificationId]);
    const notification = result.rows[0];

    if (!notification) throw new Error('Notification not found');
    if (notification.user_id !== userId) throw new Error('Unauthorized');

    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [notificationId]);
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0', [userId]);
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0',
      [userId]
    );
    return { count: parseInt(result.rows[0].count) };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const result = await pool.query('SELECT user_id FROM notifications WHERE id = $1', [notificationId]);
    const notification = result.rows[0];

    if (!notification) throw new Error('Notification not found');
    if (notification.user_id !== userId) throw new Error('Unauthorized');

    await pool.query('DELETE FROM notifications WHERE id = $1', [notificationId]);
    return { message: 'Notification deleted' };
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
