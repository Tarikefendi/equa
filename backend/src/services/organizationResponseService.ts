import pool from '../config/database';
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
    const campaign = (await pool.query(
      `SELECT c.id, c.creator_id, c.title, c.entity_id,
              e.verified as entity_verified, e.name as entity_name
       FROM campaigns c
       LEFT JOIN entities e ON c.entity_id = e.id
       WHERE c.id = $1`,
      [data.campaign_id]
    )).rows[0];

    if (!campaign) throw new Error('Campaign not found');

    // Eğer kampanya bir entity'e bağlıysa, sadece doğrulanmış entity yanıt bırakabilir
    if (campaign.entity_id && !campaign.entity_verified) {
      throw new Error('Bu kampanyaya resmi yanıt bırakmak için kurumun doğrulanmış olması gerekir.');
    }

    const responseId = randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO organization_responses (id, campaign_id, organization_name, organization_email, response_text, response_type, contact_person)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [responseId, data.campaign_id, data.organization_name, data.organization_email,
       data.response_text, data.response_type, data.contact_person || null]
    );

    logger.info(`Organization response created: ${responseId} for campaign ${data.campaign_id}`);

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

    return { id: responseId, message: 'Response submitted successfully' };
  }

  async getCampaignResponses(campaignId: string) {
    return (await pool.query(
      `SELECT * FROM organization_responses WHERE campaign_id = $1 ORDER BY created_at DESC`,
      [campaignId]
    )).rows;
  }

  async verifyResponse(responseId: string, adminUserId: string) {
    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [adminUserId])).rows[0];
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw new Error('Unauthorized: Only admins can verify responses');
    }

    await pool.query('UPDATE organization_responses SET is_verified = true WHERE id = $1', [responseId]);
    logger.info(`Response verified: ${responseId} by admin ${adminUserId}`);
    return { message: 'Response verified successfully' };
  }

  async deleteResponse(responseId: string, adminUserId: string) {
    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [adminUserId])).rows[0];
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw new Error('Unauthorized: Only admins can delete responses');
    }

    await pool.query('DELETE FROM organization_responses WHERE id = $1', [responseId]);
    logger.info(`Response deleted: ${responseId} by admin ${adminUserId}`);
    return { message: 'Response deleted successfully' };
  }
}
