import pool from '../config/database';
import logger from '../config/logger';

export const REPUTATION_POINTS = {
  campaign_created: 10,
  evidence_added: 5,
  evidence_approved: 5,
  update_added: 3,
} as const;

export class ReputationService {
  async addPoints(userId: string, points: number, type: string, referenceType?: string, referenceId?: string) {
    try {
      await pool.query(
        'UPDATE users SET reputation = reputation + $1 WHERE id = $2',
        [points, userId]
      );
      await pool.query(
        `INSERT INTO reputation_events (user_id, type, points, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, type, points, referenceType || null, referenceId || null]
      );
      logger.info(`Reputation +${points} for user ${userId} (${type})`);
    } catch (err) {
      logger.error('Reputation update error:', err);
    }
  }

  async getEvents(userId: string) {
    const result = await pool.query(
      `SELECT type, points, reference_type, reference_id, created_at
       FROM reputation_events
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  }
}
