import pool from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';
import { sendCampaignNotificationEmail } from '../config/email';
import { MilestoneService } from './milestoneService';

const milestoneService = new MilestoneService();

interface CreateSignatureDTO {
  campaign_id: string;
  message?: string;
  is_anonymous?: boolean;
  ip_address?: string;
  device_fingerprint?: string;
}

export class SignatureService {
  async addSignature(userId: string, data: CreateSignatureDTO) {
    const campaignResult = await pool.query(
      'SELECT id, status FROM campaigns WHERE id = $1',
      [data.campaign_id]
    );
    const campaign = campaignResult.rows[0];

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status === 'archived') throw new Error('Bu kampanya arşivlenmiştir.');

    const SIGNABLE_STATUSES = ['active', 'response_received', 'disputed'];
    if (!SIGNABLE_STATUSES.includes(campaign.status)) {
      throw new Error('Bu kampanyaya destek verilemez.');
    }

    const isAnonymous = data.is_anonymous === true;

    // Kullanıcı bu kampanyaya daha önce imza atmış mı? (anonim veya normal, user_id ile)
    const existingByUser = await pool.query(
      'SELECT id FROM signatures WHERE campaign_id = $1 AND user_id = $2',
      [data.campaign_id, userId]
    );
    if (existingByUser.rows.length > 0) throw new Error('You have already signed this campaign');

    // IP bazlı kontrol - aynı IP'den daha önce herhangi bir imza var mı?
    if (data.ip_address) {
      const existingByIp = await pool.query(
        'SELECT id FROM signatures WHERE campaign_id = $1 AND ip_address = $2',
        [data.campaign_id, data.ip_address]
      );
      if (existingByIp.rows.length > 0) throw new Error('You have already signed this campaign');
    }

    const signatureId = randomBytes(16).toString('hex');
    // user_id her zaman kaydedilir (anonim imzada da), sadece gösterimde gizlenir
    const effectiveUserId = userId;

    await pool.query(
      `INSERT INTO signatures (id, campaign_id, user_id, message, is_anonymous, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [signatureId, data.campaign_id, effectiveUserId, data.message || null, isAnonymous, data.ip_address || null]
    );

    // Update last_activity_at
    await pool.query('UPDATE campaigns SET last_activity_at = NOW() WHERE id = $1', [data.campaign_id]);

    logger.info(`Signature added: ${signatureId} by user ${userId}`);

    // Kampanya sahibine bildirim gönder (kendisi imzalamıyorsa)
    try {
      const owner = (await pool.query('SELECT creator_id, title FROM campaigns WHERE id = $1', [data.campaign_id])).rows[0];
      if (owner && owner.creator_id !== userId) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
           VALUES ($1, 'campaign_support', $2, $3, 'campaign', $4)`,
          [
            owner.creator_id,
            'Kampanyanıza yeni destek',
            `"${owner.title}" kampanyanız yeni bir destek aldı.`,
            data.campaign_id,
          ]
        );
      }
    } catch (err) {
      logger.error('Support notification error:', err);
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = $1',
      [data.campaign_id]
    );
    const signatureCount = parseInt(countResult.rows[0].count);

    // Check milestone
    await milestoneService.checkAndNotify(data.campaign_id, signatureCount);

    const campaignDataResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [data.campaign_id]);
    const campaignData = campaignDataResult.rows[0];

    const milestones = [2, 5, 10, 50, 100, 500, 1000];
    if (campaignData.target_email && milestones.includes(signatureCount)) {
      try {
        const campaignUrl = `${process.env.APP_URL || 'http://localhost:3000'}/campaigns/${campaignData.id}`;
        const subject = `Kampanya Bildirimi: ${campaignData.title}`;
        const content = `Kampanya: ${campaignData.title}\nİmza Sayısı: ${signatureCount}\nLink: ${campaignUrl}`;

        await sendCampaignNotificationEmail(
          campaignData.target_email,
          campaignData.title,
          campaignData.description,
          signatureCount,
          campaignUrl
        );

        const emailId = randomBytes(16).toString('hex');
        await pool.query(
          `INSERT INTO email_history (id, campaign_id, recipient_email, email_type, subject, content, signature_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [emailId, data.campaign_id, campaignData.target_email, 'milestone', subject, content, signatureCount]
        );

        logger.info(`Campaign notification email sent to ${campaignData.target_email} for ${signatureCount} signatures`);
      } catch (error) {
        logger.error('Failed to send campaign notification email:', error);
      }
    }

    return { id: signatureId, message: 'Signature added successfully' };
  }

  async removeSignature(campaignId: string, userId: string) {
    const result = await pool.query(
      'SELECT id FROM signatures WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    const signature = result.rows[0];

    if (!signature) throw new Error('Signature not found');

    await pool.query('DELETE FROM signatures WHERE id = $1', [signature.id]);
    logger.info(`Signature removed: ${signature.id}`);
    return { message: 'Signature removed successfully' };
  }

  async getCampaignSignatures(campaignId: string, includeAnonymous: boolean = true) {
    let query = `
      SELECT s.id, s.message, s.is_anonymous, s.created_at,
             u.username, u.id as user_id
      FROM signatures s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.campaign_id = $1
    `;
    if (!includeAnonymous) query += ' AND s.is_anonymous = false';
    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, [campaignId]);
    return result.rows.map(sig => ({
      ...sig,
      // is_anonymous flag'i veya is_public=false ise gizle
      username: (sig.is_anonymous || !sig.username) ? 'Anonim' : sig.username,
      user_id: sig.is_anonymous ? null : sig.user_id,
    }));
  }

  async getSignatureCount(campaignId: string) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM signatures WHERE campaign_id = $1',
      [campaignId]
    );
    return { count: parseInt(result.rows[0].count) };
  }

  async getUserSignature(campaignId: string, userId: string) {
    const result = await pool.query(
      'SELECT * FROM signatures WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    return result.rows[0] || null;
  }

  async getUserSignatures(userId: string) {
    const result = await pool.query(
      `SELECT s.*, c.title as campaign_title
       FROM signatures s
       LEFT JOIN campaigns c ON s.campaign_id = c.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}
