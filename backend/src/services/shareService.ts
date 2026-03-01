import { ActivityService } from './activityService';
import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';

const activityService = new ActivityService();

export class ShareService {
  async generateShareLinks(campaignId: string, campaignTitle: string) {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const campaignUrl = `${baseUrl}/campaigns/${campaignId}`;
    const encodedTitle = encodeURIComponent(campaignTitle);
    const encodedUrl = encodeURIComponent(campaignUrl);

    // Add tracking parameters to URLs
    const trackingParams = (platform: string) => `?utm_source=${platform}&utm_medium=social&utm_campaign=${campaignId}`;

    return {
      campaign_url: campaignUrl,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}${encodeURIComponent(trackingParams('facebook'))}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}${encodeURIComponent(trackingParams('twitter'))}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}${encodeURIComponent(trackingParams('linkedin'))}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}${encodeURIComponent(trackingParams('whatsapp'))}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}${encodeURIComponent(trackingParams('telegram'))}&text=${encodedTitle}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}${encodeURIComponent(trackingParams('reddit'))}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20campaign:%20${encodedUrl}${encodeURIComponent(trackingParams('email'))}`,
    };
  }

  async trackShare(userId: string, campaignId: string, platform: string) {
    await activityService.logActivity({
      user_id: userId,
      action_type: 'campaign_shared',
      entity_type: 'campaign',
      entity_id: campaignId,
      details: { platform },
    });

    logger.info(`Campaign ${campaignId} shared on ${platform} by user ${userId}`);

    return { message: 'Share tracked successfully' };
  }

  async trackShareClick(campaignId: string, platform: string, referrer?: string, ipAddress?: string, userAgent?: string) {
    const clickId = randomBytes(16).toString('hex');

    db.prepare(
      `INSERT INTO share_clicks (id, campaign_id, platform, referrer, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(clickId, campaignId, platform, referrer || null, ipAddress || null, userAgent || null);

    logger.info(`Share click tracked: campaign ${campaignId}, platform ${platform}`);

    return { message: 'Click tracked successfully', click_id: clickId };
  }

  async getShareCount(campaignId: string) {
    const activityService = new ActivityService();
    const activities = await activityService.getEntityActivities('campaign', campaignId);
    
    const shareActivities = activities.filter((a: any) => a.action_type === 'campaign_shared');
    
    const platformCounts: any = {};
    shareActivities.forEach((activity: any) => {
      const details = activity.details ? JSON.parse(activity.details) : {};
      const platform = details.platform || 'unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    return {
      total: shareActivities.length,
      by_platform: platformCounts,
    };
  }

  async getShareStatistics(campaignId: string) {
    // Get share counts (how many times shared)
    const shareStats = await this.getShareCount(campaignId);

    // Get click counts (how many times clicked)
    const clickStats = db.prepare(
      `SELECT platform, COUNT(*) as count
       FROM share_clicks
       WHERE campaign_id = ?
       GROUP BY platform`
    ).all(campaignId) as any[];

    const clicksByPlatform: any = {};
    let totalClicks = 0;
    clickStats.forEach((stat) => {
      clicksByPlatform[stat.platform] = stat.count;
      totalClicks += stat.count;
    });

    // Get recent clicks (last 7 days)
    const recentClicks = db.prepare(
      `SELECT DATE(clicked_at) as date, COUNT(*) as count
       FROM share_clicks
       WHERE campaign_id = ? AND clicked_at >= datetime('now', '-7 days')
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`
    ).all(campaignId) as any[];

    // Calculate click-through rate (CTR)
    const platformCTR: any = {};
    Object.keys(shareStats.by_platform).forEach((platform) => {
      const shares = shareStats.by_platform[platform];
      const clicks = clicksByPlatform[platform] || 0;
      platformCTR[platform] = {
        shares,
        clicks,
        ctr: shares > 0 ? ((clicks / shares) * 100).toFixed(2) + '%' : '0%',
      };
    });

    return {
      shares: {
        total: shareStats.total,
        by_platform: shareStats.by_platform,
      },
      clicks: {
        total: totalClicks,
        by_platform: clicksByPlatform,
      },
      ctr_by_platform: platformCTR,
      recent_activity: recentClicks,
    };
  }

  async getMostSharedCampaigns(limit: number = 10) {
    const activities = db.prepare(
      `SELECT entity_id as campaign_id, COUNT(*) as share_count
       FROM activity_logs
       WHERE action_type = 'campaign_shared' AND entity_type = 'campaign'
       GROUP BY entity_id
       ORDER BY share_count DESC
       LIMIT ?`
    ).all(limit) as any[];

    const campaigns = [];
    for (const activity of activities) {
      const campaign = db.prepare(
        'SELECT id, title, creator_id, status FROM campaigns WHERE id = ?'
      ).get(activity.campaign_id) as any;

      if (campaign) {
        campaigns.push({
          ...campaign,
          share_count: activity.share_count,
        });
      }
    }

    return campaigns;
  }

  async getShareTrends(days: number = 30) {
    const trends = db.prepare(
      `SELECT DATE(created_at) as date, 
              JSON_EXTRACT(details, '$.platform') as platform,
              COUNT(*) as count
       FROM activity_logs
       WHERE action_type = 'campaign_shared' 
       AND created_at >= datetime('now', '-' || ? || ' days')
       GROUP BY DATE(created_at), platform
       ORDER BY date DESC`
    ).all(days) as any[];

    return trends;
  }
}
