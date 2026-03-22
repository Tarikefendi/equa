import pool from '../config/database';

export class CampaignImpactService {
  async getImpactMetrics(campaignId: string) {
    const [supportRes, campaignRes, shareRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM signatures WHERE campaign_id = $1', [campaignId]),
      pool.query('SELECT views, status FROM campaigns WHERE id = $1', [campaignId]),
      pool.query('SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1', [campaignId]),
    ]);

    if (!campaignRes.rows[0]) throw new Error('Campaign not found');

    const support_count = parseInt(supportRes.rows[0].count, 10);
    const view_count = parseInt(campaignRes.rows[0].views, 10) || 0;
    const share_count = parseInt(shareRes.rows[0].count, 10);
    const campaign_status: string = campaignRes.rows[0].status;

    const conversion_rate = view_count > 0
      ? parseFloat(((support_count / view_count) * 100).toFixed(2))
      : 0;

    const response_received = campaign_status === 'response_received';

    return {
      support_count,
      view_count,
      share_count,
      conversion_rate,
      response_received,
      campaign_status,
    };
  }
}
