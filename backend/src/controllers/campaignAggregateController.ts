import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../config/database';
import { MilestoneService, MILESTONES, MILESTONE_LABELS } from '../services/milestoneService';
import logger from '../config/logger';

const milestoneService = new MilestoneService();

export class CampaignAggregateController {
  async getDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      // 1. Campaign + entity info
      const campaignRes = await pool.query(
        `SELECT c.*, u.username as creator_username,
                e.name as entity_name, e.slug as entity_slug,
                e.website as entity_website, e.country as entity_country
         FROM campaigns c
         LEFT JOIN users u ON c.creator_id = u.id
         LEFT JOIN entities e ON c.entity_id = e.id
         WHERE c.id = $1`,
        [id]
      );
      const campaign = campaignRes.rows[0];
      if (!campaign) {
        res.status(404).json({ success: false, message: 'Campaign not found' });
        return;
      }

      // Private check
      if (campaign.visibility === 'private' && campaign.creator_id !== userId) {
        const adminCheck = userId
          ? (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0]
          : null;
        if (adminCheck?.role !== 'admin') {
          res.status(404).json({ success: false, message: 'Campaign not found' });
          return;
        }
      }

      // 2. All counts in one query
      const countsRes = await pool.query(
        `SELECT
          (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1) AS support_count,
          (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_supporters,
          (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1) AS total_shares,
          (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_shares,
          (SELECT COUNT(*) FROM campaign_followers WHERE campaign_id = $1) AS follower_count,
          (SELECT COUNT(*) FROM evidence WHERE campaign_id = $1 AND status = 'approved') AS evidence_count`,
        [id]
      );
      const counts = countsRes.rows[0];
      const supportCount = parseInt(counts.support_count) || 0;

      // 3. Milestone
      const currentMilestone = milestoneService.getCurrentMilestone(supportCount);
      const nextMilestone = milestoneService.getNextMilestone(supportCount);

      // 4. User-specific data (only if logged in)
      let userSignature = null;
      let isFollowing = false;
      if (userId) {
        const [sigRes, followRes] = await Promise.all([
          pool.query(
            'SELECT id, message, is_anonymous, created_at FROM signatures WHERE campaign_id = $1 AND user_id = $2',
            [id, userId]
          ),
          pool.query(
            'SELECT id FROM campaign_followers WHERE campaign_id = $1 AND user_id = $2',
            [id, userId]
          ),
        ]);
        userSignature = sigRes.rows[0] || null;
        isFollowing = followRes.rows.length > 0;
      }

      // 5. Recent signatures (last 8)
      const signaturesRes = await pool.query(
        `SELECT s.id, s.message, s.is_anonymous, s.created_at,
                u.username, u.id as user_id
         FROM signatures s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.campaign_id = $1
         ORDER BY s.created_at DESC
         LIMIT 8`,
        [id]
      );

      // 6. Victory data (only if resolved)
      let victoryData = null;
      if (campaign.status === 'resolved' && campaign.victory_at) {
        victoryData = {
          is_victory: true,
          victory_at: campaign.victory_at,
          supporters: campaign.victory_support_count || supportCount,
        };
      }

      // Record view (fire and forget)
      pool.query(
        `INSERT INTO campaign_views (id, campaign_id, user_id, ip_address, created_at)
         SELECT gen_random_uuid(), $1, $2, $3, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM campaign_views
           WHERE campaign_id = $1
             AND (user_id = $2 OR ip_address = $3)
             AND created_at > NOW() - INTERVAL '30 minutes'
         )`,
        [id, userId, req.ip]
      ).catch(() => {});

      res.json({
        success: true,
        data: {
          campaign: {
            ...campaign,
            support_count: supportCount,
            signature_count: supportCount,
            followers_count: parseInt(counts.follower_count) || 0,
          },
          momentum: {
            total_supporters: supportCount,
            today_supporters: parseInt(counts.today_supporters) || 0,
            total_shares: parseInt(counts.total_shares) || 0,
            today_shares: parseInt(counts.today_shares) || 0,
          },
          milestone: {
            support_count: supportCount,
            current_milestone: currentMilestone,
            next_milestone: nextMilestone,
            progress_to_next: nextMilestone ? Math.round((supportCount / nextMilestone) * 100) : 100,
            all_milestones: MILESTONES.map(m => ({
              threshold: m,
              label: MILESTONE_LABELS[m].label,
              reached: supportCount >= m,
            })),
          },
          recent_signatures: signaturesRes.rows,
          evidence_count: parseInt(counts.evidence_count) || 0,
          user: {
            signature: userSignature,
            is_following: isFollowing,
          },
          victory: victoryData,
        },
      });
    } catch (error) {
      logger.error('Campaign aggregate detail error:', error);
      res.status(500).json({ success: false, message: 'Failed to load campaign detail' });
    }
  }
}
