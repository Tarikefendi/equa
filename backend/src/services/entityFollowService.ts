import pool from '../config/database';
import { randomBytes } from 'crypto';

export class EntityFollowService {
  async getStatus(entityId: string, userId: string) {
    const [followRow, countRow] = await Promise.all([
      pool.query('SELECT id FROM entity_followers WHERE entity_id = $1 AND user_id = $2', [entityId, userId]),
      pool.query('SELECT COUNT(*) as count FROM entity_followers WHERE entity_id = $1', [entityId]),
    ]);
    return {
      isFollowing: followRow.rows.length > 0,
      followerCount: parseInt(countRow.rows[0].count),
    };
  }

  async getCount(entityId: string) {
    const row = await pool.query('SELECT COUNT(*) as count FROM entity_followers WHERE entity_id = $1', [entityId]);
    return parseInt(row.rows[0].count);
  }

  async follow(entityId: string, userId: string) {
    await pool.query(
      'INSERT INTO entity_followers (entity_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [entityId, userId]
    );
    return this.getStatus(entityId, userId);
  }

  async unfollow(entityId: string, userId: string) {
    await pool.query('DELETE FROM entity_followers WHERE entity_id = $1 AND user_id = $2', [entityId, userId]);
    return this.getStatus(entityId, userId);
  }

  async notifyFollowers(entityId: string, campaignId: string, campaignTitle: string) {
    const followers = await pool.query(
      'SELECT user_id FROM entity_followers WHERE entity_id = $1',
      [entityId]
    );
    if (followers.rows.length === 0) return;

    const entity = await pool.query('SELECT name FROM entities WHERE id = $1', [entityId]);
    const entityName = entity.rows[0]?.name || '';

    for (const row of followers.rows) {
      const notifId = randomBytes(16).toString('hex');
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          notifId,
          row.user_id,
          'entity_new_campaign',
          `${entityName} ile ilgili yeni gelişme`,
          `"${campaignTitle}" kampanyasında yeni bir güncelleme var.`,
          'campaign',
          campaignId,
        ]
      );
    }
  }
}
