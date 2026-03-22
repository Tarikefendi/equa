import pool from '../config/database';
import { randomBytes } from 'crypto';

const LEGAL_SUPPORT_MIN_SIGNATURES = 50;
const MAX_ACTIVE_CASES = 3;
const MATCH_TIMEOUT_HOURS = 48;

export class LawyerService {
  // Check if a campaign is eligible for legal support
  async getLegalStatus(campaignId: string) {
    const campaignRes = await pool.query(
      `SELECT c.id, c.status, c.response_deadline_date, c.response_deadline_days, c.created_at,
              (SELECT COUNT(*) FROM signatures WHERE campaign_id = c.id) AS support_count
       FROM campaigns c WHERE c.id = $1`,
      [campaignId]
    );
    const campaign = campaignRes.rows[0];
    if (!campaign) throw new Error('Campaign not found');

    const supportCount = parseInt(campaign.support_count);
    const hasMinSupport = supportCount >= LEGAL_SUPPORT_MIN_SIGNATURES;

    let deadlinePassed = false;
    if (campaign.response_deadline_date) {
      deadlinePassed = new Date(campaign.response_deadline_date) < new Date();
    } else if (campaign.response_deadline_days) {
      const deadline = new Date(campaign.created_at);
      deadline.setDate(deadline.getDate() + campaign.response_deadline_days);
      deadlinePassed = deadline < new Date();
    }

    const insufficientResponse = campaign.status === 'no_response' || campaign.status === 'closed_unresolved';
    const isEligible = hasMinSupport && (deadlinePassed || insufficientResponse);

    const reqRes = await pool.query(
      `SELECT lr.*, l.full_name AS lawyer_name, l.specializations AS lawyer_expertise,
              l.bio AS lawyer_bio, l.city AS lawyer_city, l.is_verified AS lawyer_verified
       FROM legal_requests lr
       LEFT JOIN lawyers l ON l.id = lr.matched_lawyer_id
       WHERE lr.campaign_id = $1
       ORDER BY lr.created_at DESC LIMIT 1`,
      [campaignId]
    );
    const request = reqRes.rows[0] || null;

    return {
      is_eligible: isEligible,
      has_min_support: hasMinSupport,
      deadline_passed: deadlinePassed,
      support_count: supportCount,
      min_support_required: LEGAL_SUPPORT_MIN_SIGNATURES,
      request,
    };
  }

  // Campaign owner requests legal support
  async requestLegalSupport(campaignId: string, requesterId: string) {
    const campRes = await pool.query('SELECT creator_id FROM campaigns WHERE id = $1', [campaignId]);
    if (!campRes.rows[0]) throw new Error('Campaign not found');
    if (campRes.rows[0].creator_id !== requesterId) throw new Error('Only campaign owner can request legal support');

    const status = await this.getLegalStatus(campaignId);
    if (!status.is_eligible) throw new Error('Campaign is not eligible for legal support yet');

    // Check if there's already an active (pending/matched) request
    const existing = await pool.query(
      `SELECT id, status FROM legal_requests WHERE campaign_id = $1 AND status IN ('pending', 'matched')`,
      [campaignId]
    );
    if (existing.rows[0]) throw new Error('Legal support already requested for this campaign');

    const id = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO legal_requests (id, campaign_id, requester_id) VALUES ($1, $2, $3)`,
      [id, campaignId, requesterId]
    );

    return { id, campaign_id: campaignId, status: 'pending' };
  }

  // Lawyer applies to a legal request (first come first served)
  async applyToRequest(legalRequestId: string, lawyerId: string) {
    // Use a transaction to prevent race conditions
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reqRes = await client.query(
        'SELECT * FROM legal_requests WHERE id = $1 FOR UPDATE',
        [legalRequestId]
      );
      const req = reqRes.rows[0];
      if (!req) throw new Error('Legal request not found');
      if (req.status === 'matched') throw new Error('Bu kampanya şu anda bir avukat tarafından inceleniyor');

      // Check lawyer exists, is verified and available
      const lawyerRes = await client.query(
        'SELECT * FROM lawyers WHERE id = $1 AND is_verified = $2 AND is_available = $3',
        [lawyerId, 1, 1]
      );
      if (!lawyerRes.rows[0]) throw new Error('Lawyer not found or inactive');
      const lawyer = lawyerRes.rows[0];

      // Check active case limit
      const activeCases = await client.query(
        `SELECT COUNT(*) FROM legal_requests WHERE matched_lawyer_id = $1 AND status = 'matched'`,
        [lawyerId]
      );
      if (parseInt(activeCases.rows[0].count) >= MAX_ACTIVE_CASES) {
        throw new Error(`Şu anda maksimum aktif kampanya sayısına ulaştınız (${MAX_ACTIVE_CASES}).`);
      }

      // Insert application
      const appId = randomBytes(16).toString('hex');
      try {
        await client.query(
          `INSERT INTO lawyer_applications (id, legal_request_id, lawyer_id) VALUES ($1, $2, $3)`,
          [appId, legalRequestId, lawyerId]
        );
      } catch {
        throw new Error('You already applied to this request');
      }

      // Match immediately (first come first served)
      await client.query(
        `UPDATE legal_requests SET status = 'matched', matched_lawyer_id = $1, matched_at = NOW() WHERE id = $2`,
        [lawyerId, legalRequestId]
      );

      // Fetch campaign info
      const campRes = await client.query(
        `SELECT c.title, c.creator_id, c.id as campaign_id FROM campaigns c WHERE c.id = $1`,
        [req.campaign_id]
      );
      const campaign = campRes.rows[0];

      if (campaign) {
        // Add timeline event (only if not already exists for this campaign)
        const existingEvent = await client.query(
          `SELECT id FROM campaign_updates WHERE campaign_id = $1 AND type = 'lawyer_matched' LIMIT 1`,
          [campaign.campaign_id]
        );
        if (!existingEvent.rows[0]) {
          await client.query(
            `INSERT INTO campaign_updates (campaign_id, author_id, type, title, content, created_at)
             VALUES ($1, $2, 'lawyer_matched', 'Hukuki Değerlendirme', $3, NOW())`,
            [campaign.campaign_id, campaign.creator_id,
             `Bir avukat kampanyayla ilgilenmeye başladı. Kampanya hukuki değerlendirme aşamasına geçti.`]
          );
        }

        // Notify campaign owner
        const notifId1 = randomBytes(16).toString('hex');
        await client.query(
          `INSERT INTO notifications (id, user_id, type, title, message, is_read) VALUES ($1, $2, $3, $4, $5, 0)`,
          [notifId1, campaign.creator_id, 'lawyer_matched', 'Avukat Eşleşmesi',
            `"${campaign.title}" kampanyanız için Av. ${lawyer.full_name} talebinizi kabul etti.`]
        );

        // Notify lawyer
        const notifId2 = randomBytes(16).toString('hex');
        await client.query(
          `INSERT INTO notifications (id, user_id, type, title, message, is_read) VALUES ($1, $2, $3, $4, $5, 0)`,
          [notifId2, lawyer.user_id, 'lawyer_matched', 'Hukuki Destek Talebi',
            `"${campaign.title}" kampanyası için hukuki destek talebini kabul ettiniz.`]
        );
      }

      await client.query('COMMIT');
      return { matched: true, lawyer_id: lawyerId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Check and reopen timed-out matches (48h no response)
  async checkMatchTimeouts() {
    const timeoutThreshold = new Date(Date.now() - MATCH_TIMEOUT_HOURS * 60 * 60 * 1000);

    const timedOut = await pool.query(
      `SELECT lr.id, lr.campaign_id, lr.matched_lawyer_id, lr.requester_id,
              c.title AS campaign_title, c.creator_id
       FROM legal_requests lr
       JOIN campaigns c ON c.id = lr.campaign_id
       WHERE lr.status = 'matched' AND lr.matched_at < $1`,
      [timeoutThreshold]
    );

    for (const req of timedOut.rows) {
      // Reopen the request
      await pool.query(
        `UPDATE legal_requests
         SET status = 'pending', matched_lawyer_id = NULL, matched_at = NULL,
             reopen_count = reopen_count + 1, last_reopened_at = NOW()
         WHERE id = $1`,
        [req.id]
      );

      // Remove the timed-out application so lawyer can't re-apply
      await pool.query(
        `DELETE FROM lawyer_applications WHERE legal_request_id = $1 AND lawyer_id = $2`,
        [req.id, req.matched_lawyer_id]
      );

      // Notify campaign owner
      const notifId = randomBytes(16).toString('hex');
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, is_read) VALUES ($1, $2, $3, $4, $5, 0)`,
        [notifId, req.creator_id, 'lawyer_unmatched', 'Avukat Yanıt Vermedi',
          `"${req.campaign_title}" kampanyanız için seçilen avukat ile iletişim kurulamadı. Kampanya tekrar diğer avukatlara açıldı.`]
      );
    }

    return timedOut.rows.length;
  }

  // Get open legal requests for lawyer panel (with enriched campaign data)
  async getOpenRequests() {
    const res = await pool.query(
      `SELECT lr.id, lr.campaign_id, lr.status, lr.created_at, lr.reopen_count,
              c.title AS campaign_title, c.category, c.description, c.status AS campaign_status,
              c.response_deadline_date, c.response_deadline_days, c.created_at AS campaign_created_at,
              (SELECT COUNT(*) FROM signatures WHERE campaign_id = c.id) AS support_count,
              e.name AS entity_name
       FROM legal_requests lr
       JOIN campaigns c ON c.id = lr.campaign_id
       LEFT JOIN entities e ON e.id = c.entity_id
       WHERE lr.status = 'pending'
       ORDER BY (SELECT COUNT(*) FROM signatures WHERE campaign_id = c.id) DESC, lr.created_at DESC`
    );
    return res.rows;
  }

  // Get lawyer profile by user_id
  async getLawyerByUserId(userId: string) {
    const res = await pool.query('SELECT * FROM lawyers WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  }

  // Register as lawyer
  async registerLawyer(userId: string, data: {
    full_name: string;
    expertise: string;
    bar_number?: string;
    city?: string;
    bio?: string;
  }) {
    const existing = await pool.query('SELECT id FROM lawyers WHERE user_id = $1', [userId]);
    if (existing.rows[0]) throw new Error('Already registered as a lawyer');

    const id = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO lawyers (id, user_id, full_name, specializations, bar_number, city, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, data.full_name, data.expertise, data.bar_number || null, data.city || null, data.bio || null]
    );
    return { id, ...data, is_verified: false };
  }

  async verifyLawyer(lawyerId: string) {
    await pool.query('UPDATE lawyers SET is_verified = $1 WHERE id = $2', [1, lawyerId]);
    return { message: 'Lawyer verified' };
  }

  async rejectLawyer(lawyerId: string) {
    await pool.query('DELETE FROM lawyers WHERE id = $1', [lawyerId]);
    return { message: 'Lawyer rejected' };
  }

  async getPendingLawyers() {
    const res = await pool.query(
      `SELECT l.*, u.email FROM lawyers l JOIN users u ON u.id = l.user_id WHERE l.is_verified = $1 ORDER BY l.created_at DESC`,
      [0]
    );
    return res.rows;
  }
}
