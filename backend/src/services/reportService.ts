import pool from '../config/database';
import { randomBytes } from 'crypto';
import logger from '../config/logger';

interface CreateReportDTO {
  reporter_id: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  description?: string;
}

export class ReportService {
  async createReport(data: CreateReportDTO) {
    const reportId = randomBytes(16).toString('hex');

    const existingReport = (await pool.query(
      'SELECT id FROM reports WHERE reporter_id = $1 AND entity_type = $2 AND entity_id = $3',
      [data.reporter_id, data.entity_type, data.entity_id]
    )).rows[0];

    if (existingReport) throw new Error('You have already reported this content');

    await pool.query(
      `INSERT INTO reports (id, reporter_id, entity_type, entity_id, reason, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [reportId, data.reporter_id, data.entity_type, data.entity_id, data.reason, data.description || null]
    );

    logger.info(`Report created: ${reportId} by user ${data.reporter_id}`);

    return (await pool.query('SELECT * FROM reports WHERE id = $1', [reportId])).rows[0];
  }

  async getReports(filters?: { status?: string; entity_type?: string }) {
    let query = `SELECT r.*, u.username as reporter_username, m.username as reviewer_username
                 FROM reports r
                 LEFT JOIN users u ON r.reporter_id = u.id
                 LEFT JOIN users m ON r.reviewed_by = m.id
                 WHERE 1=1`;
    const params: any[] = [];
    let paramIdx = 1;

    if (filters?.status) {
      query += ` AND r.status = $${paramIdx++}`;
      params.push(filters.status);
    }

    if (filters?.entity_type) {
      query += ` AND r.entity_type = $${paramIdx++}`;
      params.push(filters.entity_type);
    }

    query += ' ORDER BY r.created_at DESC';

    return (await pool.query(query, params)).rows;
  }

  async getReportById(reportId: string) {
    const report = (await pool.query(
      `SELECT r.*, u.username as reporter_username, m.username as reviewer_username
       FROM reports r
       LEFT JOIN users u ON r.reporter_id = u.id
       LEFT JOIN users m ON r.reviewed_by = m.id
       WHERE r.id = $1`,
      [reportId]
    )).rows[0];

    if (!report) throw new Error('Report not found');
    return report;
  }

  async updateReportStatus(reportId: string, reviewerId: string, status: string) {
    const report = (await pool.query('SELECT id FROM reports WHERE id = $1', [reportId])).rows[0];
    if (!report) throw new Error('Report not found');

    await pool.query(
      `UPDATE reports SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`,
      [status, reviewerId, reportId]
    );

    logger.info(`Report ${reportId} updated to ${status} by ${reviewerId}`);
    return this.getReportById(reportId);
  }

  async getUserReports(userId: string) {
    return (await pool.query(
      `SELECT * FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC`,
      [userId]
    )).rows;
  }
}
