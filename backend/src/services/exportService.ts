import db from '../config/database';
import logger from '../config/logger';

export class ExportService {
  async exportUserData(userId: string) {
    const user = db.prepare(
      'SELECT id, email, username, is_verified, reputation_score, created_at FROM users WHERE id = ?'
    ).get(userId) as any;

    if (!user) {
      throw new Error('User not found');
    }

    const campaigns = db.prepare(
      'SELECT * FROM campaigns WHERE creator_id = ?'
    ).all(userId);

    const votes = db.prepare(
      'SELECT v.*, c.title as campaign_title FROM votes v LEFT JOIN campaigns c ON v.campaign_id = c.id WHERE v.user_id = ?'
    ).all(userId);

    const comments = db.prepare(
      'SELECT cm.*, c.title as campaign_title FROM comments cm LEFT JOIN campaigns c ON cm.campaign_id = c.id WHERE cm.user_id = ? AND cm.is_deleted = 0'
    ).all(userId);

    const badges = db.prepare(
      'SELECT * FROM user_badges WHERE user_id = ?'
    ).all(userId);

    const activities = db.prepare(
      'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
    ).all(userId);

    logger.info(`User data exported for user ${userId}`);

    return {
      user,
      campaigns,
      votes,
      comments,
      badges,
      activities,
      exported_at: new Date().toISOString(),
    };
  }

  async exportCampaignData(campaignId: string) {
    const campaign = db.prepare(
      'SELECT c.*, u.username as creator_username FROM campaigns c LEFT JOIN users u ON c.creator_id = u.id WHERE c.id = ?'
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const votes = db.prepare(
      'SELECT v.vote_choice, v.created_at, u.username FROM votes v LEFT JOIN users u ON v.user_id = u.id WHERE v.campaign_id = ?'
    ).all(campaignId);

    const comments = db.prepare(
      'SELECT c.content, c.created_at, c.is_edited, u.username FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.campaign_id = ? AND c.is_deleted = 0'
    ).all(campaignId);

    const milestones = db.prepare(
      'SELECT * FROM campaign_milestones WHERE campaign_id = ?'
    ).all(campaignId);

    const uploads = db.prepare(
      'SELECT * FROM uploads WHERE entity_type = ? AND entity_id = ?'
    ).all('campaign', campaignId);

    logger.info(`Campaign data exported for campaign ${campaignId}`);

    return {
      campaign,
      votes,
      comments,
      milestones,
      uploads,
      exported_at: new Date().toISOString(),
    };
  }

  convertToCSV(data: any[], headers: string[]): string {
    if (data.length === 0) return '';

    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  async exportCampaignsToCSV(filters?: { status?: string; category?: string }) {
    let query = 'SELECT c.*, u.username as creator_username FROM campaigns c LEFT JOIN users u ON c.creator_id = u.id WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters?.category) {
      query += ' AND c.category = ?';
      params.push(filters.category);
    }

    const campaigns = db.prepare(query).all(...params) as any[];

    const headers = ['id', 'title', 'description', 'target_entity', 'target_type', 'category', 'status', 'creator_username', 'created_at'];
    
    return this.convertToCSV(campaigns, headers);
  }

  async exportVotesToCSV(campaignId: string) {
    const votes = db.prepare(
      'SELECT v.*, u.username FROM votes v LEFT JOIN users u ON v.user_id = u.id WHERE v.campaign_id = ?'
    ).all(campaignId) as any[];

    const headers = ['id', 'vote_choice', 'username', 'created_at'];
    
    return this.convertToCSV(votes, headers);
  }
}
