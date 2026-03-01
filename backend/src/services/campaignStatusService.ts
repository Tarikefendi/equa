import db from '../config/database';
import { NotificationService } from './notificationService';
import logger from '../config/logger';

const notificationService = new NotificationService();

export class CampaignStatusService {
  async createStatusUpdate(data: {
    campaignId: string;
    userId: string;
    statusType: string;
    title: string;
    description?: string;
    documents?: any;
    isMilestone?: boolean;
  }) {
    const { campaignId, userId, statusType, title, description, documents, isMilestone } = data;

    // Verify campaign exists and user is the creator
    const campaign = db.prepare(
      'SELECT id, creator_id, title FROM campaigns WHERE id = ?'
    ).get(campaignId) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.creator_id !== userId) {
      throw new Error('Only campaign creator can add status updates');
    }

    // Create status update
    const statusUpdate = db.prepare(
      `INSERT INTO campaign_status_updates 
       (campaign_id, user_id, status_type, title, description, documents, is_milestone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      campaignId,
      userId,
      statusType,
      title,
      description || null,
      documents ? JSON.stringify(documents) : null,
      isMilestone ? 1 : 0
    );

    // Get the created update
    const created = db.prepare(
      'SELECT * FROM campaign_status_updates WHERE id = last_insert_rowid()'
    ).get() as any;

    logger.info(`Status update created for campaign ${campaignId}: ${statusType}`);

    return created;
  }

  async getStatusUpdates(campaignId: string) {
    const updates = db.prepare(
      `SELECT su.*, u.username 
       FROM campaign_status_updates su
       LEFT JOIN users u ON su.user_id = u.id
       WHERE su.campaign_id = ?
       ORDER BY su.created_at DESC`
    ).all(campaignId);

    return updates.map((update: any) => ({
      ...update,
      documents: update.documents ? JSON.parse(update.documents) : null,
    }));
  }

  async deleteStatusUpdate(updateId: string, userId: string) {
    // Get the update
    const update = db.prepare(
      'SELECT * FROM campaign_status_updates WHERE id = ?'
    ).get(updateId) as any;

    if (!update) {
      throw new Error('Status update not found');
    }

    // Verify user is the creator
    if (update.user_id !== userId) {
      throw new Error('Only the creator can delete this update');
    }

    // Delete the update
    db.prepare('DELETE FROM campaign_status_updates WHERE id = ?').run(updateId);

    logger.info(`Status update deleted: ${updateId}`);

    return { success: true };
  }
}
