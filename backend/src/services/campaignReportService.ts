import pool from '../config/database';

export class CampaignReportService {
  async report(campaignId: string, userId: string, reason: string, description?: string) {
    const campaign = (await pool.query('SELECT id FROM campaigns WHERE id = $1', [campaignId])).rows[0];
    if (!campaign) throw new Error('Kampanya bulunamadı.');

    try {
      const result = await pool.query(
        `INSERT INTO campaign_reports (campaign_id, user_id, reason, description)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [campaignId, userId, reason, description || null]
      );
      return result.rows[0];
    } catch (err: any) {
      if (err.code === '23505') throw new Error('Bu kampanyayı zaten şikayet ettiniz.');
      throw err;
    }
  }

  async getPendingReports() {
    const result = await pool.query(
      `SELECT cr.*, c.title as campaign_title, u.username as reporter_username
       FROM campaign_reports cr
       JOIN campaigns c ON c.id = cr.campaign_id
       JOIN users u ON u.id = cr.user_id
       WHERE cr.status = 'pending'
       ORDER BY cr.created_at DESC`
    );
    return result.rows;
  }

  async updateStatus(reportId: string, status: 'reviewed' | 'rejected') {
    const result = await pool.query(
      `UPDATE campaign_reports SET status = $1 WHERE id = $2 RETURNING *`,
      [status, reportId]
    );
    if (result.rows.length === 0) throw new Error('Rapor bulunamadı.');
    return result.rows[0];
  }

  async getUserReport(campaignId: string, userId: string) {
    const result = await pool.query(
      'SELECT id FROM campaign_reports WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    return result.rows[0] || null;
  }
}
