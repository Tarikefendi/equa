import pool from '../config/database';

export class CampaignInvestigationService {
  async toggleInvestigationMode(campaignId: string, userId: string, enabled: boolean) {
    const campaign = (await pool.query(
      'SELECT creator_id FROM campaigns WHERE id = $1',
      [campaignId]
    )).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı');

    const user = (await pool.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
    if (campaign.creator_id !== userId && !isAdmin) throw new Error('Forbidden');

    const res = await pool.query(
      'UPDATE campaigns SET investigation_mode = $1 WHERE id = $2 RETURNING id, investigation_mode',
      [enabled, campaignId]
    );
    return res.rows[0];
  }

  async getInvestigationSummary(campaignId: string) {
    const res = await pool.query(
      `SELECT
        COUNT(*) AS evidence_submitted,
        COUNT(*) FILTER (WHERE status = 'approved') AS evidence_verified,
        COUNT(*) FILTER (WHERE status = 'pending')  AS evidence_pending,
        COUNT(*) FILTER (WHERE status = 'flagged')  AS evidence_flagged
       FROM campaign_evidence
       WHERE campaign_id = $1`,
      [campaignId]
    );
    const row = res.rows[0];
    return {
      evidence_submitted: parseInt(row.evidence_submitted),
      evidence_verified:  parseInt(row.evidence_verified),
      evidence_pending:   parseInt(row.evidence_pending),
      evidence_flagged:   parseInt(row.evidence_flagged),
    };
  }
}
