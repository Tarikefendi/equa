import pool from '../config/database';
import logger from '../config/logger';
import { randomBytes } from 'crypto';

export const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000];

export const MILESTONE_LABELS: Record<number, { label: string; message: string }> = {
  10:    { label: 'İlk Adım',          message: 'Kampanya 10 destekçiye ulaştı!' },
  50:    { label: 'Dikkat Çekiyor',    message: 'Kampanya 50 destekçiye ulaştı!' },
  100:   { label: 'Yükselen Kampanya', message: 'Kampanya 100 destekçiye ulaştı!' },
  500:   { label: 'Yüksek Baskı',      message: 'Kampanya 500 destekçiye ulaştı!' },
  1000:  { label: 'Viral',             message: 'Kampanya 1.000 destekçiye ulaştı!' },
  5000:  { label: 'Kritik Kitle',      message: 'Kampanya 5.000 destekçiye ulaştı!' },
  10000: { label: 'Tarihi Kampanya',   message: 'Kampanya 10.000 destekçiye ulaştı!' },
};

export class MilestoneService {
  getCurrentMilestone(count: number): { milestone: number; label: string } | null {
    const reached = MILESTONES.filter(m => count >= m);
    if (reached.length === 0) return null;
    const milestone = reached[reached.length - 1];
    return { milestone, label: MILESTONE_LABELS[milestone].label };
  }

  getNextMilestone(count: number): number | null {
    return MILESTONES.find(m => m > count) || null;
  }

  async checkAndNotify(campaignId: string, newCount: number): Promise<void> {
    if (!MILESTONES.includes(newCount)) return;
    const info = MILESTONE_LABELS[newCount];
    if (!info) return;

    try {
      const { rows } = await pool.query(
        'SELECT id, title, creator_id FROM campaigns WHERE id = $1',
        [campaignId]
      );
      const campaign = rows[0];
      if (!campaign) return;

      // Notify campaign owner
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, $2, 'milestone_reached', $3, $4, 'campaign', $5)`,
        [randomBytes(16).toString('hex'), campaign.creator_id, `🚀 ${info.label}`,
         `"${campaign.title}" kampanyanız ${newCount.toLocaleString('tr-TR')} destekçiye ulaştı!`, campaignId]
      );

      // Notify followers
      const followers = await pool.query(
        'SELECT user_id FROM campaign_followers WHERE campaign_id = $1 AND user_id != $2',
        [campaignId, campaign.creator_id]
      );
      for (const f of followers.rows) {
        await pool.query(
          `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
           VALUES ($1, $2, 'milestone_reached', $3, $4, 'campaign', $5)`,
          [randomBytes(16).toString('hex'), f.user_id, `🚀 ${info.label}`,
           `Takip ettiğiniz "${campaign.title}" kampanyası ${newCount.toLocaleString('tr-TR')} destekçiye ulaştı!`, campaignId]
        );
      }

      logger.info(`Milestone ${newCount} reached for campaign ${campaignId}`);
    } catch (err) {
      logger.error('Milestone notification error:', err);
    }
  }

  async getMilestoneInfo(campaignId: string) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = $1',
      [campaignId]
    );
    const count = parseInt(rows[0].count) || 0;
    const current = this.getCurrentMilestone(count);
    const next = this.getNextMilestone(count);

    return {
      support_count: count,
      current_milestone: current,
      next_milestone: next,
      progress_to_next: next ? Math.round((count / next) * 100) : 100,
      all_milestones: MILESTONES.map(m => ({
        threshold: m,
        label: MILESTONE_LABELS[m].label,
        reached: count >= m,
      })),
    };
  }
}
