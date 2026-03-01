import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { NotificationService } from './notificationService';

const notificationService = new NotificationService();

interface CreateResponseDTO {
  campaign_id: string;
  organization_name: string;
  organization_email: string;
  response_text: string;
  response_type: 'official' | 'statement' | 'action_taken';
  contact_person?: string;
}

export class OrganizationResponseService {
  async createResponse(data: CreateResponseDTO) {
    // Check if campaign exists
    const campaign = db.prepare(
      'SELECT id, creator_id, title FROM campaigns WHERE id = ?'
    ).get(data.campaign_id) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const responseId = randomBytes(16).toString('hex');

    db.prepare(
      `INSERT INTO organization_responses (id, campaign_id, organization_name, organization_email, response_text, response_type, contact_person)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      responseId,
      data.campaign_id,
      data.organization_name,
      data.organization_email,
      data.response_text,
      data.response_type,
      data.contact_person || null
    );

    logger.info(`Organization response created: ${responseId} for campaign ${data.campaign_id}`);

    // Notify campaign creator
    try {
      await notificationService.createNotification({
        user_id: campaign.creator_id,
        type: 'organization_response',
        title: 'Kuruluş Yanıtı Alındı',
        message: `${data.organization_name} kampanyanıza yanıt verdi: "${campaign.title}"`,
        entity_type: 'campaign',
        entity_id: data.campaign_id,
      });
    } catch (error) {
      logger.error('Failed to send notification:', error);
    }

    return {
      id: responseId,
      message: 'Response submitted successfully',
    };
  }

  async getCampaignResponses(campaignId: string) {
    const responses = db.prepare(
      `SELECT * FROM organization_responses
       WHERE campaign_id = ?
       ORDER BY created_at DESC`
    ).all(campaignId);

    return responses;
  }

  async verifyResponse(responseId: string, adminUserId: string) {
    // Check if user is admin
    const user = db.prepare(
      'SELECT role FROM users WHERE id = ?'
    ).get(adminUserId) as any;

    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw new Error('Unauthorized: Only admins can verify responses');
    }

    db.prepare(
      'UPDATE organization_responses SET is_verified = 1 WHERE id = ?'
    ).run(responseId);

    logger.info(`Response verified: ${responseId} by admin ${adminUserId}`);

    return { message: 'Response verified successfully' };
  }

  async deleteResponse(responseId: string, adminUserId: string) {
    // Check if user is admin
    const user = db.prepare(
      'SELECT role FROM users WHERE id = ?'
    ).get(adminUserId) as any;

    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw new Error('Unauthorized: Only admins can delete responses');
    }

    db.prepare('DELETE FROM organization_responses WHERE id = ?').run(responseId);

    logger.info(`Response deleted: ${responseId} by admin ${adminUserId}`);

    return { message: 'Response deleted successfully' };
  }
}
