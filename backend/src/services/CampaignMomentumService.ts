import pool from '../config/database';

export class CampaignMomentumService {
  async getMomentum(campaignId: string) {
    const res = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1) AS total_supporters,
        (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_supporters,
        (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1) AS total_shares,
        (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_shares`,
      [campaignId]
    );

    const row = res.rows[0];
    return {
      total_supporters: parseInt(row.total_supporters) || 0,
      today_supporters: parseInt(row.today_supporters) || 0,
      total_shares: parseInt(row.total_shares) || 0,
      today_shares: parseInt(row.today_shares) || 0,
    };
  }
}
