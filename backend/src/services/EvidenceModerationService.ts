import pool from '../config/database';

export class EvidenceModerationService {
  async approveEvidence(evidenceId: string, userId: string) {
    const ev = await this.getEvidenceWithCampaign(evidenceId);
    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (ev.creator_id !== userId && !isAdmin) throw new Error('Forbidden');

    const res = await pool.query(
      `UPDATE campaign_evidence SET status = 'approved' WHERE id = $1 RETURNING *`,
      [evidenceId]
    );
    return res.rows[0];
  }

  async rejectEvidence(evidenceId: string, userId: string) {
    const ev = await this.getEvidenceWithCampaign(evidenceId);
    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (ev.creator_id !== userId && !isAdmin) throw new Error('Forbidden');

    const res = await pool.query(
      `UPDATE campaign_evidence SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [evidenceId]
    );
    return res.rows[0];
  }

  async flagEvidence(evidenceId: string, userId: string) {
    // Check if already flagged by this user
    const existing = await pool.query(
      'SELECT id FROM evidence_flags WHERE evidence_id = $1 AND user_id = $2',
      [evidenceId, userId]
    );
    if (existing.rows.length > 0) throw new Error('Zaten işaretlediniz');

    // Insert flag record
    await pool.query(
      'INSERT INTO evidence_flags (evidence_id, user_id) VALUES ($1, $2)',
      [evidenceId, userId]
    );

    // Increment flag_count
    const res = await pool.query(
      `UPDATE campaign_evidence SET flag_count = flag_count + 1 WHERE id = $1 RETURNING flag_count`,
      [evidenceId]
    );

    const flagCount = res.rows[0]?.flag_count || 0;

    // Auto-flag if threshold reached
    if (flagCount >= 3) {
      await pool.query(
        `UPDATE campaign_evidence SET status = 'flagged' WHERE id = $1 AND status = 'approved'`,
        [evidenceId]
      );
    }

    return { flag_count: flagCount, auto_flagged: flagCount >= 3 };
  }

  async getEvidenceSummary(campaignId: string) {
    const res = await pool.query(
      `SELECT
        COUNT(*) AS total_evidence,
        COUNT(*) FILTER (WHERE status = 'approved') AS verified_evidence,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_review,
        COUNT(*) FILTER (WHERE status = 'flagged') AS flagged
       FROM campaign_evidence
       WHERE campaign_id = $1`,
      [campaignId]
    );
    const row = res.rows[0];
    return {
      total_evidence: parseInt(row.total_evidence),
      verified_evidence: parseInt(row.verified_evidence),
      pending_review: parseInt(row.pending_review),
      flagged: parseInt(row.flagged),
    };
  }

  async getFlaggedEvidence() {
    const res = await pool.query(
      `SELECT ce.*, c.title AS campaign_title
       FROM campaign_evidence ce
       JOIN campaigns c ON c.id = ce.campaign_id
       WHERE ce.status = 'flagged'
       ORDER BY ce.flag_count DESC, ce.created_at DESC`
    );
    return res.rows;
  }

  private async getEvidenceWithCampaign(evidenceId: string) {
    const res = await pool.query(
      `SELECT ce.*, c.creator_id FROM campaign_evidence ce
       JOIN campaigns c ON c.id = ce.campaign_id
       WHERE ce.id = $1`,
      [evidenceId]
    );
    if (!res.rows[0]) throw new Error('Kanıt bulunamadı');
    return res.rows[0];
  }
}
