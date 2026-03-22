import pool from '../config/database';
import logger from '../config/logger';

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

    const campaign = (await pool.query(
      'SELECT id, creator_id, title FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.creator_id !== userId) throw new Error('Only campaign creator can add status updates');

    const created = (await pool.query(
      `INSERT INTO campaign_status_updates
       (campaign_id, user_id, status_type, title, description, documents, is_milestone)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [campaignId, userId, statusType, title, description || null,
       documents ? JSON.stringify(documents) : null, isMilestone || false]
    )).rows[0];

    logger.info(`Status update created for campaign ${campaignId}: ${statusType}`);
    return created;
  }

  async getStatusUpdates(campaignId: string) {
    const updates = (await pool.query(
      `SELECT su.*, u.username
       FROM campaign_status_updates su
       LEFT JOIN users u ON su.user_id = u.id
       WHERE su.campaign_id = $1
       ORDER BY su.created_at DESC`,
      [campaignId]
    )).rows;

    return updates.map((update: any) => ({
      ...update,
      documents: update.documents ? JSON.parse(update.documents) : null,
    }));
  }

  async deleteStatusUpdate(updateId: string, userId: string) {
    const update = (await pool.query(
      'SELECT * FROM campaign_status_updates WHERE id = $1',
      [updateId]
    )).rows[0];

    if (!update) throw new Error('Status update not found');
    if (update.user_id !== userId) throw new Error('Only the creator can delete this update');

    await pool.query('DELETE FROM campaign_status_updates WHERE id = $1', [updateId]);
    logger.info(`Status update deleted: ${updateId}`);
    return { success: true };
  }
}
