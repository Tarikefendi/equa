import pool from '../config/database';
import { ReputationService, REPUTATION_POINTS } from './reputationService';
import { FollowService } from './followService';

const reputationService = new ReputationService();
const followService = new FollowService();

export class EvidenceService {
  // Public: sadece approved
  async getEvidence(campaignId: string) {
    const result = await pool.query(
      `SELECT ce.id, ce.campaign_id, ce.type, ce.title, ce.description, ce.url, ce.file_path,
              ce.added_by, ce.created_at, ce.status, ce.credibility_type, ce.flag_count, ce.verification_source,
              CASE WHEN u.is_public = true THEN u.username ELSE 'Anonim' END as submitted_by
       FROM campaign_evidence ce
       LEFT JOIN users u ON ce.added_by = u.id
       WHERE ce.campaign_id = $1 AND ce.status = 'approved'
       ORDER BY ce.created_at ASC`,
      [campaignId]
    );
    return result.rows;
  }

  // Owner/admin: sadece pending
  async getPendingEvidence(campaignId: string, userId: string) {
    const campaign = (await pool.query('SELECT creator_id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı.');

    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (campaign.creator_id !== userId && !isAdmin) throw new Error('Forbidden');

    const result = await pool.query(
      `SELECT ce.id, ce.campaign_id, ce.type, ce.title, ce.description, ce.url, ce.file_path, ce.added_by, ce.created_at,
              CASE WHEN u.is_public = true THEN u.username ELSE 'Anonim' END as submitted_by
       FROM campaign_evidence ce
       LEFT JOIN users u ON ce.added_by = u.id
       WHERE ce.campaign_id = $1 AND ce.status = 'pending'
       ORDER BY ce.created_at ASC`,
      [campaignId]
    );
    return result.rows;
  }

  // Herkes kanıt ekleyebilir — pending olarak başlar
  async addEvidence(campaignId: string, userId: string, data: {
    type: 'link' | 'document' | 'image';
    title: string;
    description?: string;
    url?: string;
    file_path?: string;
    credibility_type?: string;
  }) {
    const campaign = (await pool.query('SELECT id, creator_id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı.');

    if (!['link', 'document', 'image'].includes(data.type)) throw new Error('Geçersiz kanıt türü.');
    if (!data.url) throw new Error('URL zorunludur.');

    // Kampanya sahibi ekliyorsa direkt approved + verification_source = 'campaign_owner'
    const isOwner = campaign.creator_id === userId;
    const status = isOwner ? 'approved' : 'pending';
    const verificationSource = isOwner ? 'campaign_owner' : 'pending_review';

    const result = await pool.query(
      `INSERT INTO campaign_evidence (campaign_id, type, title, description, url, file_path, added_by, status, credibility_type, verification_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [campaignId, data.type, data.title, data.description || null, data.url || null, data.file_path || null, userId, status, data.credibility_type || 'user_submission', verificationSource]
    );

    // Update last_activity_at
    await pool.query('UPDATE campaigns SET last_activity_at = NOW() WHERE id = $1', [campaignId]);

    const campaignTitle = (await pool.query('SELECT title FROM campaigns WHERE id = $1', [campaignId])).rows[0]?.title || '';
    const typeLabel = data.type === 'image' ? 'görsel' : data.type === 'document' ? 'belge' : 'link';

    // Kampanya sahibi kendisi eklemediyse sahibe bildirim gönder
    if (!isOwner) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'evidence_submitted', $2, $3, 'campaign', $4)`,
        [
          campaign.creator_id,
          'Yeni kanıt gönderildi',
          `"${campaignTitle}" kampanyanıza yeni bir ${typeLabel} kanıtı eklendi: "${data.title}" — onayınızı bekliyor.`,
          campaignId,
        ]
      );
    }

    // Kanıt direkt approved ise (sahip ekledi) takipçilere bildirim gönder
    if (status === 'approved') {
      try {
        await followService.notifyFollowers(
          campaignId,
          'evidence_added',
          `Kampanyaya yeni kanıt eklendi`,
          `"${campaignTitle}" kampanyasına yeni bir ${typeLabel} kanıtı eklendi: "${data.title}"`,
          campaignId
        );
      } catch (err) {
        console.error('Follow notification error:', err);
      }
    }

    return result.rows[0];
  }

  // Owner/admin: onayla veya reddet
  async updateEvidenceStatus(evidenceId: string, userId: string, status: 'approved' | 'rejected') {
    const ev = (await pool.query(
      'SELECT ce.*, c.creator_id FROM campaign_evidence ce JOIN campaigns c ON c.id = ce.campaign_id WHERE ce.id = $1',
      [evidenceId]
    )).rows[0];
    if (!ev) throw new Error('Kanıt bulunamadı.');

    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (ev.creator_id !== userId && !isAdmin) throw new Error('Forbidden');

    const result = await pool.query(
      'UPDATE campaign_evidence SET status = $1 WHERE id = $2 RETURNING *',
      [status, evidenceId]
    );

    // Kanıt onaylandıysa ekleyene reputation ver ve takipçilere bildirim gönder
    if (status === 'approved' && ev.added_by) {
      await reputationService.addPoints(ev.added_by, REPUTATION_POINTS.evidence_approved, 'evidence_approved', 'evidence', evidenceId);

      try {
        const campaignTitle = (await pool.query('SELECT title FROM campaigns WHERE id = $1', [ev.campaign_id])).rows[0]?.title || '';
        const typeLabel = ev.type === 'image' ? 'görsel' : ev.type === 'document' ? 'belge' : 'link';
        await followService.notifyFollowers(
          ev.campaign_id,
          'evidence_added',
          `Kampanyaya yeni kanıt eklendi`,
          `"${campaignTitle}" kampanyasına yeni bir ${typeLabel} kanıtı onaylandı: "${ev.title}"`,
          ev.campaign_id
        );
      } catch (err) {
        console.error('Follow notification error:', err);
      }
    }

    return result.rows[0];
  }

  async deleteEvidence(campaignId: string, evidenceId: string, userId: string) {
    const campaign = (await pool.query('SELECT creator_id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı.');

    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (campaign.creator_id !== userId && !isAdmin) throw new Error('Forbidden');

    const result = await pool.query(
      'DELETE FROM campaign_evidence WHERE id = $1 AND campaign_id = $2 RETURNING id',
      [evidenceId, campaignId]
    );
    if (result.rows.length === 0) throw new Error('Kanıt bulunamadı.');
    return { message: 'Silindi' };
  }
}
