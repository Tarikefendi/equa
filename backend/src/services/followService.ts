import pool from '../config/database';

export class FollowService {
  async follow(campaignId: string, userId: string) {
    // Kampanya var mı?
    const campaign = (await pool.query('SELECT id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı');

    // Zaten takip ediyor mu?
    const existing = (await pool.query(
      'SELECT id FROM campaign_followers WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    )).rows[0];
    if (existing) throw new Error('Zaten takip ediyorsunuz');

    await pool.query(
      'INSERT INTO campaign_followers (campaign_id, user_id) VALUES ($1, $2)',
      [campaignId, userId]
    );
    return { following: true };
  }

  async unfollow(campaignId: string, userId: string) {
    await pool.query(
      'DELETE FROM campaign_followers WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    return { following: false };
  }

  async isFollowing(campaignId: string, userId: string) {
    const row = (await pool.query(
      'SELECT id FROM campaign_followers WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    )).rows[0];
    return !!row;
  }

  async getFollowerCount(campaignId: string) {
    const row = (await pool.query(
      'SELECT COUNT(*) as count FROM campaign_followers WHERE campaign_id = $1',
      [campaignId]
    )).rows[0];
    return parseInt(row.count);
  }

  // Takipçilere bildirim gönder (güncelleme veya status değişimi)
  async notifyFollowers(campaignId: string, type: string, title: string, message: string, entityId?: string) {
    const followers = (await pool.query(
      'SELECT user_id FROM campaign_followers WHERE campaign_id = $1',
      [campaignId]
    )).rows;

    if (followers.length === 0) return;

    for (const f of followers) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, 'campaign', $5)`,
        [f.user_id, type, title, message, entityId || campaignId]
      );
    }
  }
}
