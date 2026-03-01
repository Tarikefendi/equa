import db from '../config/database';
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

    // Check if user already reported this entity
    const existingReport = db.prepare(
      'SELECT id FROM reports WHERE reporter_id = ? AND entity_type = ? AND entity_id = ?'
    ).get(data.reporter_id, data.entity_type, data.entity_id);

    if (existingReport) {
      throw new Error('You have already reported this content');
    }

    db.prepare(
      `INSERT INTO reports (id, reporter_id, entity_type, entity_id, reason, description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).run(
      reportId,
      data.reporter_id,
      data.entity_type,
      data.entity_id,
      data.reason,
      data.description || null
    );

    logger.info(`Report created: ${reportId} by user ${data.reporter_id}`);

    return db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
  }

  async getReports(filters?: { status?: string; entity_type?: string }) {
    let query = `SELECT r.*, u.username as reporter_username, m.username as reviewer_username
                 FROM reports r
                 LEFT JOIN users u ON r.reporter_id = u.id
                 LEFT JOIN users m ON r.reviewed_by = m.id
                 WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND r.status = ?';
      params.push(filters.status);
    }

    if (filters?.entity_type) {
      query += ' AND r.entity_type = ?';
      params.push(filters.entity_type);
    }

    query += ' ORDER BY r.created_at DESC';

    const reports = db.prepare(query).all(...params);

    return reports;
  }

  async getReportById(reportId: string) {
    const report = db.prepare(
      `SELECT r.*, u.username as reporter_username, m.username as reviewer_username
       FROM reports r
       LEFT JOIN users u ON r.reporter_id = u.id
       LEFT JOIN users m ON r.reviewed_by = m.id
       WHERE r.id = ?`
    ).get(reportId);

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  async updateReportStatus(reportId: string, reviewerId: string, status: string) {
    const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(reportId);

    if (!report) {
      throw new Error('Report not found');
    }

    db.prepare(
      `UPDATE reports 
       SET status = ?, reviewed_by = ?, reviewed_at = datetime('now')
       WHERE id = ?`
    ).run(status, reviewerId, reportId);

    logger.info(`Report ${reportId} updated to ${status} by ${reviewerId}`);

    return this.getReportById(reportId);
  }

  async getUserReports(userId: string) {
    const reports = db.prepare(
      `SELECT * FROM reports 
       WHERE reporter_id = ? 
       ORDER BY created_at DESC`
    ).all(userId);

    return reports;
  }
}
