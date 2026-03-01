import db from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { sendCampaignNotificationEmail } from '../config/email';

interface CreateSignatureDTO {
  campaign_id: string;
  message?: string;
  is_anonymous?: boolean;
  ip_address?: string;
  device_fingerprint?: string;
}

export class SignatureService {
  async addSignature(userId: string, data: CreateSignatureDTO) {
    // Check if campaign exists and is active
    const campaign = db.prepare(
      'SELECT id, status FROM campaigns WHERE id = ?'
    ).get(data.campaign_id) as any;

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error('Can only sign active campaigns');
    }

    // Check if user already signed
    const existingSignature = db.prepare(
      'SELECT id FROM signatures WHERE campaign_id = ? AND user_id = ?'
    ).get(data.campaign_id, userId);

    if (existingSignature) {
      throw new Error('You have already signed this campaign');
    }

    const signatureId = randomBytes(16).toString('hex');

    db.prepare(
      `INSERT INTO signatures (id, campaign_id, user_id, message, is_anonymous, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      signatureId,
      data.campaign_id,
      userId,
      data.message || null,
      data.is_anonymous ? 1 : 0,
      data.ip_address || null
    );

    logger.info(`Signature added: ${signatureId} by user ${userId}`);

    // Check if we should send email to target organization
    const signatureCount = db.prepare(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = ?'
    ).get(data.campaign_id) as any;

    const campaignData = db.prepare(
      'SELECT * FROM campaigns WHERE id = ?'
    ).get(data.campaign_id) as any;

    // Send email at milestones: 2, 5, 10, 50, 100 signatures (for testing)
    const milestones = [2, 5, 10, 50, 100, 500, 1000];
    if (campaignData.target_email && milestones.includes(signatureCount.count)) {
      try {
        const campaignUrl = `${process.env.APP_URL || 'http://localhost:3000'}/campaigns/${campaignData.id}`;
        const subject = `Kampanya Bildirimi: ${campaignData.title}`;
        const content = `Kampanya: ${campaignData.title}\nİmza Sayısı: ${signatureCount.count}\nLink: ${campaignUrl}`;
        
        await sendCampaignNotificationEmail(
          campaignData.target_email,
          campaignData.title,
          campaignData.description,
          signatureCount.count,
          campaignUrl
        );

        // Save to email history
        const emailId = randomBytes(16).toString('hex');
        db.prepare(
          `INSERT INTO email_history (id, campaign_id, recipient_email, email_type, subject, content, signature_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          emailId,
          data.campaign_id,
          campaignData.target_email,
          'milestone',
          subject,
          content,
          signatureCount.count
        );

        logger.info(`Campaign notification email sent to ${campaignData.target_email} for ${signatureCount.count} signatures`);
      } catch (error) {
        logger.error('Failed to send campaign notification email:', error);
      }
    }

    return {
      id: signatureId,
      message: 'Signature added successfully',
    };
  }

  async removeSignature(campaignId: string, userId: string) {
    const signature = db.prepare(
      'SELECT id FROM signatures WHERE campaign_id = ? AND user_id = ?'
    ).get(campaignId, userId) as any;

    if (!signature) {
      throw new Error('Signature not found');
    }

    db.prepare('DELETE FROM signatures WHERE id = ?').run(signature.id);

    logger.info(`Signature removed: ${signature.id}`);

    return { message: 'Signature removed successfully' };
  }

  async getCampaignSignatures(campaignId: string, includeAnonymous: boolean = true) {
    let query = `
      SELECT s.id, s.message, s.is_anonymous, s.created_at,
             u.username, u.id as user_id
      FROM signatures s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.campaign_id = ?
    `;

    if (!includeAnonymous) {
      query += ' AND s.is_anonymous = 0';
    }

    query += ' ORDER BY s.created_at DESC';

    const signatures = db.prepare(query).all(campaignId) as any[];

    // Hide username for anonymous signatures
    return signatures.map(sig => ({
      ...sig,
      username: sig.is_anonymous ? 'Anonim' : sig.username,
      user_id: sig.is_anonymous ? null : sig.user_id,
    }));
  }

  async getSignatureCount(campaignId: string) {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = ?'
    ).get(campaignId) as any;

    return { count: result.count };
  }

  async getUserSignature(campaignId: string, userId: string) {
    const signature = db.prepare(
      'SELECT * FROM signatures WHERE campaign_id = ? AND user_id = ?'
    ).get(campaignId, userId);

    return signature;
  }

  async getUserSignatures(userId: string) {
    const signatures = db.prepare(
      `SELECT s.*, c.title as campaign_title
       FROM signatures s
       LEFT JOIN campaigns c ON s.campaign_id = c.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`
    ).all(userId);

    return signatures;
  }
}
