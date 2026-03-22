import pool from '../config/database';
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

    await pool.query(
      `INSERT INTO activity_logs (id, user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        activityId,
        data.user_id,
        data.action_type,
        data.entity_type,
        data.entity_id || null,
        data.details ? JSON.stringify(data.details) : null,
      ]
    );

    logger.info(`Activity logged: ${data.action_type} by user ${data.user_id}`);
    return activityId;
  }

  async getUserActivities(userId: string, limit: number = 50) {
    const result = await pool.query(
      `SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async getActivityFeed(limit: number = 100) {
    const result = await pool.query(
      `SELECT a.*, u.username
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getEntityActivities(entityType: string, entityId: string) {
    const result = await pool.query(
      `SELECT a.*, u.username
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_type = $1 AND a.entity_id = $2
       ORDER BY a.created_at DESC`,
      [entityType, entityId]
    );
    return result.rows;
  }
}
