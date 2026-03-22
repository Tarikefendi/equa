import pool from '../config/database';

export class AnalyticsService {
  async getPlatformStats() {
    const totalUsers = (await pool.query('SELECT COUNT(*) as count FROM users')).rows[0];
    const totalCampaigns = (await pool.query('SELECT COUNT(*) as count FROM campaigns')).rows[0];
    const totalVotes = (await pool.query('SELECT COUNT(*) as count FROM votes')).rows[0];
    const activeCampaigns = (await pool.query(
      "SELECT COUNT(*) as count FROM campaigns WHERE status = 'active'"
    )).rows[0];
    const verifiedUsers = (await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_verified = true'
    )).rows[0];

    return {
      total_users: parseInt(totalUsers.count),
      verified_users: parseInt(verifiedUsers.count),
      total_campaigns: parseInt(totalCampaigns.count),
      active_campaigns: parseInt(activeCampaigns.count),
      total_votes: parseInt(totalVotes.count),
    };
  }

  async getCampaignAnalytics(campaignId: string) {
    const campaign = (await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Campaign not found');

    const voteStats = (await pool.query(
      `SELECT vote_choice, COUNT(*) as count FROM votes WHERE campaign_id = $1 GROUP BY vote_choice`,
      [campaignId]
    )).rows;

    const totalVotes = (await pool.query(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = $1',
      [campaignId]
    )).rows[0];

    const viewCount = (await pool.query(
      "SELECT COUNT(*) as count FROM activity_logs WHERE entity_type = 'campaign' AND entity_id = $1 AND action_type = 'campaign_viewed'",
      [campaignId]
    )).rows[0];

    const shareCount = (await pool.query(
      "SELECT COUNT(*) as count FROM activity_logs WHERE entity_type = 'campaign' AND entity_id = $1 AND action_type = 'campaign_shared'",
      [campaignId]
    )).rows[0];

    const votes: any = { total: parseInt(totalVotes.count), support: 0, oppose: 0, neutral: 0 };
    voteStats.forEach((stat: any) => { votes[stat.vote_choice] = parseInt(stat.count); });

    const totalV = parseInt(totalVotes.count);
    const views = parseInt(viewCount.count);

    return {
      campaign_id: campaignId,
      title: campaign.title,
      status: campaign.status,
      created_at: campaign.created_at,
      votes,
      views,
      shares: parseInt(shareCount.count),
      engagement_rate: totalV > 0 && views > 0 ? (totalV / views * 100).toFixed(2) : 0,
    };
  }

  async getUserAnalytics(userId: string) {
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];
    if (!user) throw new Error('User not found');

    const campaignCount = (await pool.query(
      'SELECT COUNT(*) as count FROM campaigns WHERE creator_id = $1', [userId]
    )).rows[0];

    const voteCount = (await pool.query(
      'SELECT COUNT(*) as count FROM votes WHERE user_id = $1', [userId]
    )).rows[0];

    const activeCampaigns = (await pool.query(
      "SELECT COUNT(*) as count FROM campaigns WHERE creator_id = $1 AND status = 'active'", [userId]
    )).rows[0];

    return {
      user_id: userId,
      username: user.username,
      reputation_score: user.reputation_score,
      is_verified: user.is_verified,
      campaigns_created: parseInt(campaignCount.count),
      active_campaigns: parseInt(activeCampaigns.count),
      votes_cast: parseInt(voteCount.count),
      member_since: user.created_at,
    };
  }

  async getTrendingCampaigns(limit: number = 10) {
    return (await pool.query(
      `SELECT c.*, COUNT(DISTINCT v.id) as vote_count, u.username as creator_username
       FROM campaigns c
       LEFT JOIN votes v ON c.id = v.campaign_id
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.status = 'active'
       GROUP BY c.id, u.username
       ORDER BY vote_count DESC
       LIMIT $1`,
      [limit]
    )).rows;
  }

  async getCategoryStats() {
    return (await pool.query(
      `SELECT category, COUNT(*) as campaign_count,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
       FROM campaigns
       GROUP BY category
       ORDER BY campaign_count DESC`
    )).rows;
  }
}
