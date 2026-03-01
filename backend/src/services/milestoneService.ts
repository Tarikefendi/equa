import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { NotificationService } from './notificationService';

const notificationService = new NotificationService();

interface CreateMilestoneDTO {
  campaign_id: string;
  title: string;
  description?: string;
  target_value: number;
}

export class MilestoneService {
  async createMilestone(data: CreateMilestoneDTO) {
    const milestoneId = randomBytes(16).toString('hex');

    // Check if campaign exists
    const campaign = db.prepare('SELECT id, creator_id FROM campaigns WHERE id = ?').get(data.campaign_id) as any;
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    db.prepare(
      `INSERT INTO campaign_milestones (id, campaign_id, title, description, target_value, current_value)
       VALUES (?, ?, ?, ?, ?, 0)`
    ).run(
      milestoneId,
      data.campaign_id,
      data.title,
      data.description || null,
      data.target_value
    );

    logger.info(`Milestone created: ${milestoneId} for campaign ${data.campaign_id}`);

    return db.prepare('SELECT * FROM campaign_milestones WHERE id = ?').get(milestoneId);
  }

  async getCampaignMilestones(campaignId: string) {
    const milestones = db.prepare(
      'SELECT * FROM campaign_milestones WHERE campaign_id = ? ORDER BY created_at ASC'
    ).all(campaignId);

    return milestones;
  }

  async updateMilestoneProgress(milestoneId: string, currentValue: number) {
    const milestone = db.prepare(
      'SELECT * FROM campaign_milestones WHERE id = ?'
    ).get(milestoneId) as any;

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    const isCompleted = currentValue >= milestone.target_value ? 1 : 0;
    const completedAt = isCompleted && !milestone.is_completed ? new Date().toISOString() : milestone.completed_at;

    db.prepare(
      `UPDATE campaign_milestones 
       SET current_value = ?, is_completed = ?, completed_at = ?
       WHERE id = ?`
    ).run(currentValue, isCompleted, completedAt, milestoneId);

    // If just completed, notify campaign creator
    if (isCompleted && !milestone.is_completed) {
      const campaign = db.prepare('SELECT creator_id FROM campaigns WHERE id = ?').get(milestone.campaign_id) as any;
      
      await notificationService.createNotification({
        user_id: campaign.creator_id,
        type: 'milestone_completed',
        title: 'Milestone Completed!',
        message: `Your campaign reached the milestone: ${milestone.title}`,
        entity_type: 'campaign',
        entity_id: milestone.campaign_id,
      });

      logger.info(`Milestone completed: ${milestoneId}`);
    }

    return db.prepare('SELECT * FROM campaign_milestones WHERE id = ?').get(milestoneId);
  }

  async deleteMilestone(milestoneId: string, userId: string) {
    const milestone = db.prepare(
      `SELECT m.*, c.creator_id 
       FROM campaign_milestones m
       JOIN campaigns c ON m.campaign_id = c.id
       WHERE m.id = ?`
    ).get(milestoneId) as any;

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    if (milestone.creator_id !== userId) {
      throw new Error('Unauthorized: Only campaign creator can delete milestones');
    }

    db.prepare('DELETE FROM campaign_milestones WHERE id = ?').run(milestoneId);

    logger.info(`Milestone deleted: ${milestoneId}`);

    return { message: 'Milestone deleted successfully' };
  }

  async autoUpdateMilestones(campaignId: string) {
    // Get vote count for campaign
    const voteCount = db.prepare(
      'SELECT COUNT(*) as count FROM votes WHERE campaign_id = ?'
    ).get(campaignId) as any;

    // Update all vote-based milestones
    const milestones = db.prepare(
      'SELECT * FROM campaign_milestones WHERE campaign_id = ?'
    ).all(campaignId) as any[];

    for (const milestone of milestones) {
      await this.updateMilestoneProgress(milestone.id, voteCount.count);
    }
  }
}
