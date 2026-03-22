import pool from '../config/database';
import logger from '../config/logger';
import { NotificationService } from './notificationService';

const notificationService = new NotificationService();

const SPAM_KEYWORDS = [
  'viagra', 'casino', 'porn', 'xxx', 'sex', 'lottery', 'winner',
  'click here', 'buy now', 'limited time', 'act now', 'free money',
  'kumar', 'bahis', 'seks', 'porno', 'tıkla', 'hemen al', 'bedava para'
];

const AUTO_APPROVE_REPUTATION = 100;
const SKIP_REVIEW_REPUTATION = 250;

export class CampaignApprovalService {
  async checkForSpam(title: string, description: string): Promise<{ isSpam: boolean; reason?: string }> {
    const content = `${title} ${description}`.toLowerCase();

    for (const keyword of SPAM_KEYWORDS) {
      if (content.includes(keyword.toLowerCase())) {
        return { isSpam: true, reason: `Spam keyword detected: ${keyword}` };
      }
    }

    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 50) {
      return { isSpam: true, reason: 'Excessive capital letters' };
    }

    const punctuationRatio = (content.match(/[!?]{3,}/g) || []).length;
    if (punctuationRatio > 3) {
      return { isSpam: true, reason: 'Excessive punctuation' };
    }

    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 5) {
      return { isSpam: true, reason: 'Too many URLs' };
    }

    return { isSpam: false };
  }

  async determineCampaignStatus(userId: string, campaignData: any): Promise<{
    status: 'active' | 'under_review' | 'draft';
    reason: string;
  }> {
    const user = (await pool.query('SELECT reputation_score, role FROM users WHERE id = $1', [userId])).rows[0];
    if (!user) throw new Error('User not found');

    // Admin ve moderatörler direkt active
    if (user.role === 'admin' || user.role === 'moderator') {
      return { status: 'active', reason: 'Auto-approved: Admin/Moderator user' };
    }

    const reputation = user.reputation_score || 0;

    const spamCheck = await this.checkForSpam(campaignData.title, campaignData.description);
    if (spamCheck.isSpam) {
      logger.warn(`Spam detected in campaign by user ${userId}: ${spamCheck.reason}`);
      return { status: 'draft', reason: `Spam detected: ${spamCheck.reason}` };
    }

    if (reputation >= SKIP_REVIEW_REPUTATION) {
      logger.info(`Campaign auto-approved for high reputation user ${userId} (${reputation})`);
      return { status: 'active', reason: 'Auto-approved: High reputation user' };
    }

    if (reputation >= AUTO_APPROVE_REPUTATION) {
      logger.info(`Campaign approved for trusted user ${userId} (${reputation})`);
      return { status: 'active', reason: 'Auto-approved: Trusted user' };
    }

    logger.info(`Campaign needs review for user ${userId} (${reputation})`);
    return { status: 'under_review', reason: 'Manual review required: New or low reputation user' };
  }

  async processCampaignApproval(campaignId: string, userId: string) {
    const campaign = (await pool.query(
      'SELECT title, description, status FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');

    const approval = await this.determineCampaignStatus(userId, campaign);
    await pool.query('UPDATE campaigns SET status = $1 WHERE id = $2', [approval.status, campaignId]);

    if (approval.status === 'active') {
      await notificationService.createNotification({
        user_id: userId,
        type: 'campaign_approved',
        title: '✅ Kampanyanız Yayında!',
        message: `"${campaign.title}" kampanyanız otomatik olarak onaylandı ve yayında!`,
      });
    } else if (approval.status === 'under_review') {
      await notificationService.createNotification({
        user_id: userId,
        type: 'campaign_review',
        title: '⏳ Kampanyanız İnceleniyor',
        message: `"${campaign.title}" kampanyanız moderatör onayı bekliyor.`,
      });
    } else if (approval.status === 'draft') {
      await notificationService.createNotification({
        user_id: userId,
        type: 'campaign_rejected',
        title: '❌ Kampanya Reddedildi',
        message: `"${campaign.title}" kampanyanız reddedildi. Sebep: ${approval.reason}`,
      });
    }

    logger.info(`Campaign ${campaignId} status set to ${approval.status}: ${approval.reason}`);
    return { status: approval.status, reason: approval.reason };
  }

  async getApprovalStats() {
    return (await pool.query(`
      SELECT
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as auto_approved,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as pending_review,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as rejected
      FROM campaigns
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `)).rows[0];
  }

  async getCampaignsByStatus(status: string, limit: number = 50) {
    return (await pool.query(
      `SELECT c.*, u.username as creator_username, u.reputation_score as creator_reputation
       FROM campaigns c
       JOIN users u ON c.creator_id = u.id
       WHERE c.status = $1
       ORDER BY c.created_at DESC
       LIMIT $2`,
      [status, limit]
    )).rows;
  }
}
