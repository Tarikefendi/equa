import pool from '../config/database';
import logger from '../config/logger';
import { NotificationService } from './notificationService';

const notificationService = new NotificationService();

export class AdminService {
  async getDashboardStats() {
    const userStats = (await pool.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users
      FROM users
    `)).rows[0];

    const campaignStats = (await pool.query(`
      SELECT
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as pending_campaigns,
        COUNT(CASE WHEN status = 'concluded' THEN 1 END) as concluded_campaigns,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_campaigns_week
      FROM campaigns
    `)).rows[0];

    const reportStats = (await pool.query(`
      SELECT
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_reports,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports
      FROM reports
    `)).rows[0];

    const activityStats = (await pool.query(`
      SELECT
        COUNT(*) as total_activities,
        COUNT(CASE WHEN action_type = 'campaign_created' THEN 1 END) as campaigns_created,
        COUNT(CASE WHEN action_type = 'campaign_shared' THEN 1 END) as campaigns_shared,
        COUNT(CASE WHEN action_type = 'campaign_viewed' THEN 1 END) as campaigns_viewed
      FROM activity_logs
      WHERE created_at >= NOW() - INTERVAL '1 day'
    `)).rows[0];

    const engagementStats = (await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM votes) as total_votes,
        (SELECT COUNT(*) FROM signatures) as total_signatures
    `)).rows[0];

    return {
      users: userStats,
      campaigns: campaignStats,
      reports: reportStats,
      activity: activityStats,
      engagement: engagementStats,
    };
  }

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
    let paramIdx = 1;

    if (filters?.role) {
      query += ` AND u.role = $${paramIdx++}`;
      params.push(filters.role);
    }

    if (filters?.verified !== undefined) {
      query += ` AND u.is_verified = $${paramIdx++}`;
      params.push(filters.verified);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIdx++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIdx++}`;
      params.push(filters.offset);
    }

    return (await pool.query(query, params)).rows;
  }

  async updateUserRole(userId: string, newRole: 'user' | 'moderator' | 'admin') {
    const user = (await pool.query('SELECT username FROM users WHERE id = $1', [userId])).rows[0];
    if (!user) throw new Error('User not found');

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [newRole, userId]);
    logger.info(`User ${userId} role updated to ${newRole}`);

    await notificationService.createNotification({
      user_id: userId,
      type: 'role_changed',
      title: '🎖️ Rolünüz Güncellendi',
      message: `Yeni rolünüz: ${newRole === 'admin' ? 'Admin' : newRole === 'moderator' ? 'Moderatör' : 'Kullanıcı'}`,
    });

    return { message: 'User role updated successfully' };
  }

  async banUser(userId: string, reason: string, bannedBy: string) {
    const user = (await pool.query('SELECT username FROM users WHERE id = $1', [userId])).rows[0];
    if (!user) throw new Error('User not found');

    const banId = require('crypto').randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO user_bans (id, user_id, reason, banned_by, banned_at) VALUES ($1,$2,$3,$4,NOW())`,
      [banId, userId, reason, bannedBy]
    );

    logger.info(`User ${userId} banned by ${bannedBy}. Reason: ${reason}`);
    return { message: 'User banned successfully' };
  }

  async getPendingCampaigns(limit: number = 50) {
    return (await pool.query(
      `SELECT c.*, u.username as creator_username, u.reputation_score as creator_reputation
       FROM campaigns c
       JOIN users u ON c.creator_id = u.id
       WHERE c.status = 'under_review'
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [limit]
    )).rows;
  }

  async approveCampaign(campaignId: string, approvedBy: string) {
    const campaign = (await pool.query(
      'SELECT creator_id, title FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];
    if (!campaign) throw new Error('Campaign not found');

    await pool.query('UPDATE campaigns SET status = $1 WHERE id = $2', ['active', campaignId]);

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
    const campaign = (await pool.query(
      'SELECT creator_id, title FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];
    if (!campaign) throw new Error('Campaign not found');

    await pool.query('UPDATE campaigns SET status = $1 WHERE id = $2', ['draft', campaignId]);

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
    const campaign = (await pool.query(
      'SELECT creator_id, title FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];
    if (!campaign) throw new Error('Campaign not found');

    await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);
    logger.info(`Campaign ${campaignId} deleted by ${deletedBy}`);
    return { message: 'Campaign deleted successfully' };
  }

  async getPendingReports(limit: number = 50) {
    return (await pool.query(
      `SELECT r.*,
             u.username as reporter_username,
             CASE
               WHEN r.entity_type = 'campaign' THEN (SELECT title FROM campaigns WHERE id = r.entity_id)
               WHEN r.entity_type = 'user' THEN (SELECT username FROM users WHERE id = r.entity_id)
             END as entity_name
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       WHERE r.status IN ('pending', 'reviewing')
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    )).rows;
  }

  async updateReportStatus(
    reportId: string,
    status: 'reviewing' | 'resolved' | 'rejected',
    resolution?: string,
    reviewedBy?: string
  ) {
    const report = (await pool.query('SELECT * FROM reports WHERE id = $1', [reportId])).rows[0];
    if (!report) throw new Error('Report not found');

    await pool.query(
      `UPDATE reports SET status = $1, resolution = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4`,
      [status, resolution || null, reviewedBy || null, reportId]
    );

    logger.info(`Report ${reportId} status updated to ${status} by ${reviewedBy}`);
    return { message: 'Report status updated successfully' };
  }

  async getRecentActivity(limit: number = 100) {
    const activities = (await pool.query(
      `SELECT a.*, u.username
       FROM activity_logs a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    )).rows;

    return activities.map((activity: any) => ({
      ...activity,
      details: activity.details ? JSON.parse(activity.details) : {},
    }));
  }

  async getSystemHealth() {
    const tableStats = (await pool.query(`
      SELECT schemaname, tablename,
             pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)).rows;

    return {
      tables: tableStats,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
    };
  }

  async getPendingLawyers() {
    return (await pool.query(
      `SELECT l.*, u.username, u.email
       FROM lawyers l
       JOIN users u ON l.user_id = u.id
       WHERE l.is_verified = $1
       ORDER BY l.created_at DESC`,
      [0]
    )).rows;
  }

  async verifyLawyer(lawyerId: string) {
    const lawyer = (await pool.query('SELECT * FROM lawyers WHERE id = $1', [lawyerId])).rows[0];
    if (!lawyer) throw new Error('Lawyer not found');

    await pool.query('UPDATE lawyers SET is_verified = $2 WHERE id = $1', [lawyerId, 1]);

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
    const lawyer = (await pool.query('SELECT * FROM lawyers WHERE id = $1', [lawyerId])).rows[0];
    if (!lawyer) throw new Error('Lawyer not found');

    await notificationService.createNotification({
      user_id: lawyer.user_id,
      type: 'lawyer_rejected',
      title: '❌ Avukat Kaydınız Reddedildi',
      message: 'Avukat kaydınız incelendi ve reddedildi. Daha fazla bilgi için destek ekibiyle iletişime geçebilirsiniz.',
    });

    await pool.query('DELETE FROM lawyers WHERE id = $1', [lawyerId]);
    logger.info(`Lawyer rejected and deleted: ${lawyerId}`);
    return { message: 'Lawyer registration rejected' };
  }

  async createInstitutionAccount(entityId: string, email: string, password: string, username: string) {
    // Entity var mı?
    const entity = (await pool.query('SELECT id, name, verified FROM entities WHERE id = $1', [entityId])).rows[0];
    if (!entity) throw new Error('Entity not found');
    if (!entity.verified) throw new Error('Entity must be verified before creating an institution account');

    // Bu entity için zaten hesap var mı?
    const existing = (await pool.query(
      'SELECT id FROM users WHERE entity_id = $1',
      [entityId]
    )).rows[0];
    if (existing) throw new Error('An institution account already exists for this entity');

    // Email/username çakışması
    const conflict = (await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    )).rows[0];
    if (conflict) throw new Error('Email or username already in use');

    const bcrypt = require('bcrypt');
    const { randomBytes } = require('crypto');
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, role, entity_id, is_verified)
       VALUES ($1, $2, $3, $4, 'institution', $5, 1)`,
      [userId, email, username, passwordHash, entityId]
    );

    await pool.query('INSERT INTO user_profiles (user_id) VALUES ($1)', [userId]);

    logger.info(`Institution account created for entity ${entityId}: ${email}`);
    return { message: 'Institution account created', userId, email, username, entity_name: entity.name };
  }
}
