import pool from '../config/database';

const VALID_PLATFORMS = ['whatsapp', 'x', 'telegram', 'copy_link', 'other'];

export class CampaignShareService {
  async recordShare(campaignId: string, platform: string, userId?: string) {
    const campaign = (await pool.query('SELECT id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı.');

    const p = VALID_PLATFORMS.includes(platform) ? platform : 'other';

    await pool.query(
      `INSERT INTO campaign_shares (campaign_id, user_id, platform) VALUES ($1, $2, $3)`,
      [campaignId, userId || null, p]
    );

    const result = await pool.query(
      `UPDATE campaigns SET share_count = share_count + 1 WHERE id = $1 RETURNING share_count`,
      [campaignId]
    );

    return { share_count: result.rows[0].share_count };
  }

  async getShareStats(campaignId: string) {
    const [total, byPlatform] = await Promise.all([
      pool.query('SELECT share_count FROM campaigns WHERE id = $1', [campaignId]),
      pool.query(
        `SELECT platform, COUNT(*) as count FROM campaign_shares WHERE campaign_id = $1 GROUP BY platform ORDER BY count DESC`,
        [campaignId]
      ),
    ]);
    return {
      total: total.rows[0]?.share_count || 0,
      by_platform: byPlatform.rows,
    };
  }
}
