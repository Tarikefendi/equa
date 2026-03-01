import db from '../config/database';
import logger from '../config/logger';
import { NotificationService } from './notificationService';

const notificationService = new NotificationService();

// Spam keywords (Turkish and English)
const SPAM_KEYWORDS = [
  'viagra', 'casino', 'porn', 'xxx', 'sex', 'lottery', 'winner',
  'click here', 'buy now', 'limited time', 'act now', 'free money',
  'kumar', 'bahis', 'seks', 'porno', 'tıkla', 'hemen al', 'bedava para'
];

// Minimum reputation for auto-approval
const AUTO_APPROVE_REPUTATION = 100;

// Minimum reputation for skip review
const SKIP_REVIEW_REPUTATION = 250;

export class CampaignApprovalService {
  // Check if campaign contains spam
  async checkForSpam(title: string, description: string): Promise<{ isSpam: boolean; reason?: string }> {
    const content = `${title} ${description}`.toLowerCase();

    // Check for spam keywords
    for (const keyword of SPAM_KEYWORDS) {
      if (content.includes(keyword.toLowerCase())) {
        return {
          isSpam: true,
          reason: `Spam keyword detected: ${keyword}`,
        };
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 50) {
      return {
        isSpam: true,
        reason: 'Excessive capital letters',
      };
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?]{3,}/g) || []).length;
    if (punctuationRatio > 3) {
      return {
        isSpam: true,
        reason: 'Excessive punctuation',
      };
    }

    // Check for suspicious URLs
    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 5) {
      return {
        isSpam: true,
        reason: 'Too many URLs',
      };
    }

    return { isSpam: false };
  }

  // Determine campaign status based on user reputation
  async determineCampaignStatus(userId: string, campaignData: any): Promise<{
    status: 'active' | 'under_review' | 'draft';
    reason: string;
  }> {
    // Get user reputation
    const user = db.prepare('SELECT reputation_score FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    const reputation = user.reputation_score || 0;

    // Check for spam
    const spamCheck = await this.checkForSpam(campaignData.title, campaignData.description);
    
    if (spamCheck.isSpam) {
      logger.warn(`Spam detected in campaign by user ${userId}: ${spamCheck.reason}`);
      return {
        status: 'draft',
        reason: `Spam detected: ${spamCheck.reason}`,
      };
    }

    // High reputation users get auto-approved
    if (reputation >= SKIP_REVIEW_REPUTATION) {
      logger.info(`Campaign auto-approved for high reputation user ${userId} (${reputation})`);
      return {
        status: 'active',
        reason: 'Auto-approved: High reputation user',
      };
    }

    // Medium reputation users get faster approval
    if (reputation >= AUTO_APPROVE_REPUTATION) {
      logger.info(`Campaign approved for trusted user ${userId} (${reputation})`);
      return {
        status: 'active',
        reason: 'Auto-approved: Trusted user',
      };
    }

    // Low reputation users need manual review
    logger.info(`Campaign needs review for user ${userId} (${reputation})`);
    return {
      status: 'under_review',
      reason: 'Manual review required: New or low reputation user',
    };
  }

  // Process campaign approval
  async processCampaignApproval(campaignId: string, userId: string) {
    const campaign = db.prepare('SELECT title, description, status FROM campaigns WHERE id = ?').get(campaignId) as any;
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const approval = await this.determineCampaignStatus(userId, campaign);

    // Update campaign status
    db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run(approval.status, campaignId);

    // Send notification to user
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

    return {
      status: approval.status,
      reason: approval.reason,
    };
  }

  // Get approval statistics
  async getApprovalStats() {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as auto_approved,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as pending_review,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as rejected
      FROM campaigns
      WHERE created_at >= datetime('now', '-30 days')
    `).get() as any;

    return stats;
  }

  // Get campaigns by approval status
  async getCampaignsByStatus(status: string, limit: number = 50) {
    const campaigns = db.prepare(`
      SELECT c.*, u.username as creator_username, u.reputation_score as creator_reputation
      FROM campaigns c
      JOIN users u ON c.creator_id = u.id
      WHERE c.status = ?
      ORDER BY c.created_at DESC
      LIMIT ?
    `).all(status, limit);

    return campaigns;
  }
}
