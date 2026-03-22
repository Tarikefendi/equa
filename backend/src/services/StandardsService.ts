import pool from '../config/database';

export class StandardsService {
  async getCategories() {
    const res = await pool.query(
      'SELECT id, name, description FROM standard_categories ORDER BY name'
    );
    return res.rows;
  }

  async getStandards(categoryId?: number) {
    const query = categoryId
      ? `SELECT s.id, s.title, s.description, s.source_url, s.category_id, sc.name AS category_name
         FROM standards s
         LEFT JOIN standard_categories sc ON sc.id = s.category_id
         WHERE s.category_id = $1
         ORDER BY s.title`
      : `SELECT s.id, s.title, s.description, s.source_url, s.category_id, sc.name AS category_name
         FROM standards s
         LEFT JOIN standard_categories sc ON sc.id = s.category_id
         ORDER BY sc.name, s.title`;
    const res = await pool.query(query, categoryId ? [categoryId] : []);
    return res.rows;
  }

  async suggestStandard(data: {
    title: string;
    description?: string;
    category_id?: number;
    source_url?: string;
    suggested_by: string;
  }) {
    // Placeholder AI confidence score (0.5–0.9 range based on title length as mock)
    const ai_confidence = Math.min(0.5 + data.title.length * 0.01, 0.9);

    const res = await pool.query(
      `INSERT INTO standard_suggestions (title, description, category_id, source_url, suggested_by, ai_confidence, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [data.title, data.description || null, data.category_id || null, data.source_url || null, data.suggested_by, ai_confidence]
    );
    return res.rows[0];
  }

  async getSuggestions(status?: string) {
    const query = status
      ? `SELECT ss.*, u.username AS suggested_by_username, sc.name AS category_name
         FROM standard_suggestions ss
         LEFT JOIN users u ON u.id = ss.suggested_by
         LEFT JOIN standard_categories sc ON sc.id = ss.category_id
         WHERE ss.status = $1
         ORDER BY ss.created_at DESC`
      : `SELECT ss.*, u.username AS suggested_by_username, sc.name AS category_name
         FROM standard_suggestions ss
         LEFT JOIN users u ON u.id = ss.suggested_by
         LEFT JOIN standard_categories sc ON sc.id = ss.category_id
         ORDER BY ss.created_at DESC`;
    const res = await pool.query(query, status ? [status] : []);
    return res.rows;
  }

  private async sendNotification(userId: string, type: string, title: string, message: string) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)`,
        [userId, type, title, message]
      );
    } catch (_) {}
  }

  async approveSuggestion(suggestionId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const suggRes = await client.query(
        'SELECT * FROM standard_suggestions WHERE id = $1',
        [suggestionId]
      );
      if (!suggRes.rows[0]) throw new Error('Suggestion not found');
      const s = suggRes.rows[0];

      const stdRes = await client.query(
        `INSERT INTO standards (title, description, category_id, source_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [s.title, s.description, s.category_id, s.source_url]
      );

      await client.query(
        `UPDATE standard_suggestions SET status = 'approved' WHERE id = $1`,
        [suggestionId]
      );

      await client.query('COMMIT');

      // Notify the suggester
      if (s.suggested_by) {
        await this.sendNotification(
          s.suggested_by,
          'standard_approved',
          '✅ Standart öneriniz onaylandı',
          `"${s.title}" öneriniz standart kütüphanesine eklendi.`
        );
      }

      return stdRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async rejectSuggestion(suggestionId: number) {
    const res = await pool.query(
      `UPDATE standard_suggestions SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [suggestionId]
    );
    if (!res.rows[0]) throw new Error('Suggestion not found');
    const s = res.rows[0];

    // Notify the suggester
    if (s.suggested_by) {
      await this.sendNotification(
        s.suggested_by,
        'standard_rejected',
        '❌ Standart öneriniz reddedildi',
        `"${s.title}" başlıklı standart öneriniz reddedildi.`
      );
    }

    return s;
  }
}
