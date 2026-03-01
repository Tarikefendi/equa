import db from '../config/database';
import logger from '../config/logger';
import { NotificationService } from './notificationService';

const notificationService = new NotificationService();

export class AdminService {
  // Dashboard Statistics
  async getDashboardStats() {
    // User stats
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_users_week,
        COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_users_month,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users
      FROM users
    `).get() as any;

    // Campaign stats
    const campaignStats = db.prepare(`
      SELECT 
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as pending_campaigns,
        COUNT(CASE WHEN status = 'concluded' THEN 1 END) as concluded_campaigns,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_campaigns_week
      FROM campaigns
    `).get() as any;

    // Report stats
    const reportStats = db.prepare(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_reports,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports
      FROM reports
    `).get() as any;

    // Activity stats (last 24 hours)
    const activityStats = db.prepare(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN action_type = 'campaign_created' THEN 1 END) as campaigns_created,
        COUNT(CASE WHEN action_type = 'campaign_shared' THEN 1 END) as campaigns_shared,
        COUNT(CASE WHEN action_type = 'campaign_viewed' THEN 1 END) as campaigns_viewed
      FROM activity_logs
      WHERE created_at >= datetime('now', '-1 day')
    `).get() as any;

    // Vote and signature stats
    const engagementStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM votes) as total_votes,
        (SELECT COUNT(*) FROM signatures) as total_signatures,
        (SELECT COUNT(*) FROM comments WHERE is_deleted = 0) as total_comments
    `).get() as any;

    return {
      users: userStats,
      campaigns: campaignStats,
      reports: reportStats,
      activity: activityStats,
      engagement: engagementStats,
    };
  }

  // User Management
  async getAllUsers(filters?: { role?: string; verified?: boolean; limit?: number; offset?: number }) {
    let query = `
      SELECT u.id, u.email, u.username, u.role, u.is_verified, u.reputation_score, u.created_at,
             COUNT(DISTINCT c.id) as campaign_count,
             COUNT(DISTINCT v.id) as vote_count
      FROM users u
      LEFT JOIN campaigns c ON u.id = c.creator_id
      LEFT JOIN votes v ON u.id = v.user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.role) {
      query += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters?.verified !== undefined) {
      query += ' AND u.is_verified = ?';
      params.push(filters.verified ? 1 : 0);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const users = db.prepare(query).all(...params);
    return users;
  }

  async updateUserRole(userId: string, newRole: 'user' | 'moderator' | 'admin') {
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);

    logger.info(`User ${userId} role updated to ${newRole}`);

    // Send notification
    await notificationService.createNotification({
      user_id: userId,
      type: 'role_changed',
      title: '🎖️ Rolünüz Güncellendi',
      message: `Yeni rolünüz: ${newRole === 'admin' ? 'Admin' : newRole === 'moderator' ? 'Moderatör' : 'Kullanıcı'}`,
    });

    return { message: 'User role updated successfully' };
  }

  async banUser(userId: string, reason: string, bannedBy: string) {
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    // Add ban record (we'll need to create this table)
    const banId = require('crypto').randomBytes(16).toString('hex');
    
    db.prepare(`
      INSERT INTO user_bans (id, user_id, reason, banned_by, banned_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(banId, userId, reason, bannedBy);

    logger.info(`User ${userId} banned by ${bannedBy}. Reason: ${reason}`);

    return { message: 'User banned successfully' };
  }

  // Campaign Management
  async getPendingCampaigns(limit: number = 50) {
    const campaigns = db.prepare(`
      SELECT c.*, u.username as creator_username, u.reputation_score as creator_reputation
      FROM campaigns c
      JOIN users u ON c.creator_id = u.id
      WHERE c.status = 'under_review'
      ORDER BY c.created_at DESC
      LIMIT ?
    `).all(limit);

    return campaigns;
  }

  async approveCampaign(campaignId: string, approvedBy: string) {
    const campaign = db.prepare('SELECT creator_id, title FROM campaigns WHERE id = ?').get(campaignId) as any;
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('active', campaignId);

    // Send notification
    await notificationService.createNotification({
      user_id: campaign.creator_id,
      type: 'campaign_approved',
      title: '✅ Kampanyanız Onaylandı',
      message: `"${campaign.title}" kampanyanız onaylandı ve yayında!`,
    });

    logger.info(`Campaign ${campaignId} approved by ${approvedBy}`);

    return { message: 'Campaign approved successfully' };
  }

  async rejectCampaign(campaignId: string, reason: string, rejectedBy: string) {
    const campaign = db.prepare('SELECT creator_id, title FROM campaigns WHERE id = ?').get(campaignId) as any;
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('draft', campaignId);

    // Send notification
    await notificationService.createNotification({
      user_id: campaign.creator_id,
      type: 'campaign_rejected',
      title: '❌ Kampanyanız Reddedildi',
      message: `"${campaign.title}" kampanyanız reddedildi. Sebep: ${reason}`,
    });

    logger.info(`Campaign ${campaignId} rejected by ${rejectedBy}. Reason: ${reason}`);

    return { message: 'Campaign rejected successfully' };
  }

  async deleteCampaign(campaignId: string, deletedBy: string) {
    const campaign = db.prepare('SELECT creator_id, title FROM campaigns WHERE id = ?').get(campaignId) as any;
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    db.prepare('DELETE FROM campaigns WHERE id = ?').run(campaignId);

    logger.info(`Campaign ${campaignId} deleted by ${deletedBy}`);

    return { message: 'Campaign deleted successfully' };
  }

  // Report Management
  async getPendingReports(limit: number = 50) {
    const reports = db.prepare(`
      SELECT r.*, 
             u.username as reporter_username,
             CASE 
               WHEN r.entity_type = 'campaign' THEN (SELECT title FROM campaigns WHERE id = r.entity_id)
               WHEN r.entity_type = 'comment' THEN (SELECT content FROM comments WHERE id = r.entity_id)
               WHEN r.entity_type = 'user' THEN (SELECT username FROM users WHERE id = r.entity_id)
             END as entity_name
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.status IN ('pending', 'reviewing')
      ORDER BY r.created_at DESC
      LIMIT ?
    `).all(limit);

    return reports;
  }

  async updateReportStatus(
    reportId: string, 
    status: 'reviewing' | 'resolved' | 'rejected',
    resolution?: string,
    reviewedBy?: string
  ) {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId) as any;
    
    if (!report) {
      throw new Error('Report not found');
    }

    db.prepare(`
      UPDATE reports 
      SET status = ?, resolution = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(status, resolution || null, reviewedBy || null, reportId);

    logger.info(`Report ${reportId} status updated to ${status} by ${reviewedBy}`);

    return { message: 'Report status updated successfully' };
  }

  // Activity Logs
  async getRecentActivity(limit: number = 100) {
    const activities = db.prepare(`
      SELECT a.*, u.username
      FROM activity_logs a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(limit);

    return activities.map((activity: any) => ({
      ...activity,
      details: activity.details ? JSON.parse(activity.details) : {},
    }));
  }

  // System Health
  async getSystemHealth() {
    const dbSize = db.prepare(`
      SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()
    `).get() as any;

    const tableStats = db.prepare(`
      SELECT name, 
             (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as row_count
      FROM sqlite_master m
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    return {
      database_size: dbSize.size,
      tables: tableStats,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
    };
  }

  // Lawyer Management
  async getPendingLawyers() {
    const lawyers = db.prepare(`
      SELECT l.*, u.username, u.email
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE l.is_verified = 0
      ORDER BY l.created_at DESC
    `).all();

    return lawyers;
  }

  async verifyLawyer(lawyerId: string) {
    const lawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(lawyerId) as any;

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    db.prepare('UPDATE lawyers SET is_verified = 1 WHERE id = ?').run(lawyerId);

    // Send notification
    await notificationService.createNotification({
      user_id: lawyer.user_id,
      type: 'lawyer_verified',
      title: '✅ Avukat Kaydınız Onaylandı',
      message: 'Avukat kaydınız onaylandı! Artık kampanyalara hukuki destek sağlayabilirsiniz.',
      entity_type: 'lawyer',
      entity_id: lawyerId,
    });

    logger.info(`Lawyer verified: ${lawyerId}`);

    return { message: 'Lawyer verified successfully' };
  }

  async rejectLawyer(lawyerId: string) {
    const lawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(lawyerId) as any;

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    // Send notification before deletion
    await notificationService.createNotification({
      user_id: lawyer.user_id,
      type: 'lawyer_rejected',
      title: '❌ Avukat Kaydınız Reddedildi',
      message: 'Avukat kaydınız incelendi ve reddedildi. Daha fazla bilgi için destek ekibiyle iletişime geçebilirsiniz.',
    });

    // Delete the lawyer registration
    db.prepare('DELETE FROM lawyers WHERE id = ?').run(lawyerId);

    logger.info(`Lawyer rejected and deleted: ${lawyerId}`);

    return { message: 'Lawyer registration rejected' };
  }
}
