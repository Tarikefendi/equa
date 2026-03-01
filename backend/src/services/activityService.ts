import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';

interface CreateActivityDTO {
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
}

export class ActivityService {
  async logActivity(data: CreateActivityDTO) {
    const activityId = randomBytes(16).toString('hex');

    db.prepare(
      `INSERT INTO activity_logs (id, user_id, action_type, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      activityId,
      data.user_id,
      data.action_type,
      data.entity_type,
      data.entity_id || null,
      data.details ? JSON.stringify(data.details) : null
    );

    logger.info(`Activity logged: ${data.action_type} by user ${data.user_id}`);

    return activityId;
  }

  async getUserActivities(userId: string, limit: number = 50) {
    const activities = db.prepare(
      `SELECT * FROM activity_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    ).all(userId, limit);

    return activities;
  }

  async getActivityFeed(limit: number = 100) {
    const activities = db.prepare(
      `SELECT a.*, u.username
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`
    ).all(limit);

    return activities;
  }

  async getEntityActivities(entityType: string, entityId: string) {
    const activities = db.prepare(
      `SELECT a.*, u.username
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_type = ? AND a.entity_id = ?
       ORDER BY a.created_at DESC`
    ).all(entityType, entityId);

    return activities;
  }
}
