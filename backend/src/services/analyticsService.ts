import db from '../config/database';

export class AnalyticsService {
  async getPlatformStats() {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const totalCampaigns = db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as any;
    const totalVotes = db.prepare('SELECT COUNT(*) as count FROM votes').get() as any;
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_deleted = 0').get() as any;
    
    const activeCampaigns = db.prepare(
      "SELECT COUNT(*) as count FROM campaigns WHERE status = 'active'"
    ).get() as any;

    const verifiedUsers = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_verified = 1'
    ).get() as any;

    return {
      total_users: totalUsers.count,
      verified_users: verifiedUsers.count,
      total_campaigns: totalCampaigns.count,
      active_campaigns: activeCampaigns.count,
      total_votes: totalVotes.count,
      total_comments: totalComments.count,
    };
  }

  async getCampaignAnalytics(campaignId: string) {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId) as any;
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Vote statistics
    const voteStats = db.prepare(
      `SELECT 
        vote_choice,
        COUNT(*) as count
       FROM votes
       WHERE campaign_id = ?
       GROUP BY vote_choice`
    ).all(campaignId) as any[];

    const totalVotes = db.prepare(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = ?'
    ).get(campaignId) as any;

    // Comment count
    const commentCount = db.prepare(
      'SELECT COUNT(*) as count FROM comments WHERE campaign_id = ? AND is_deleted = 0'
    ).get(campaignId) as any;

    // View count (from activity logs)
    const viewCount = db.prepare(
      "SELECT COUNT(*) as count FROM activity_logs WHERE entity_type = 'campaign' AND entity_id = ? AND action_type = 'campaign_viewed'"
    ).get(campaignId) as any;

    // Share count
    const shareCount = db.prepare(
      "SELECT COUNT(*) as count FROM activity_logs WHERE entity_type = 'campaign' AND entity_id = ? AND action_type = 'campaign_shared'"
    ).get(campaignId) as any;

    const votes: any = {
      total: totalVotes.count,
      support: 0,
      oppose: 0,
      neutral: 0,
    };

    voteStats.forEach((stat) => {
      votes[stat.vote_choice] = stat.count;
    });

    return {
      campaign_id: campaignId,
      title: campaign.title,
      status: campaign.status,
      created_at: campaign.created_at,
      votes,
      comments: commentCount.count,
      views: viewCount.count,
      shares: shareCount.count,
      engagement_rate: totalVotes.count > 0 ? ((commentCount.count + totalVotes.count) / viewCount.count * 100).toFixed(2) : 0,
    };
  }

  async getUserAnalytics(userId: string) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    const campaignCount = db.prepare(
      'SELECT COUNT(*) as count FROM campaigns WHERE creator_id = ?'
    ).get(userId) as any;

    const voteCount = db.prepare(
      'SELECT COUNT(*) as count FROM votes WHERE user_id = ?'
    ).get(userId) as any;

    const commentCount = db.prepare(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ? AND is_deleted = 0'
    ).get(userId) as any;

    const badgeCount = db.prepare(
      'SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?'
    ).get(userId) as any;

    const activeCampaigns = db.prepare(
      "SELECT COUNT(*) as count FROM campaigns WHERE creator_id = ? AND status = 'active'"
    ).get(userId) as any;

    return {
      user_id: userId,
      username: user.username,
      reputation_score: user.reputation_score,
      is_verified: user.is_verified,
      campaigns_created: campaignCount.count,
      active_campaigns: activeCampaigns.count,
      votes_cast: voteCount.count,
      comments_made: commentCount.count,
      badges_earned: badgeCount.count,
      member_since: user.created_at,
    };
  }

  async getTrendingCampaigns(limit: number = 10) {
    const campaigns = db.prepare(
      `SELECT 
        c.*,
        COUNT(DISTINCT v.id) as vote_count,
        COUNT(DISTINCT cm.id) as comment_count,
        u.username as creator_username
       FROM campaigns c
       LEFT JOIN votes v ON c.id = v.campaign_id
       LEFT JOIN comments cm ON c.id = cm.campaign_id AND cm.is_deleted = 0
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.status = 'active'
       GROUP BY c.id
       ORDER BY (vote_count + comment_count) DESC
       LIMIT ?`
    ).all(limit);

    return campaigns;
  }

  async getCategoryStats() {
    const stats = db.prepare(
      `SELECT 
        category,
        COUNT(*) as campaign_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
       FROM campaigns
       GROUP BY category
       ORDER BY campaign_count DESC`
    ).all();

    return stats;
  }
}
