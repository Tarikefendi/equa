import pool from '../config/database';

export class EntityTransparencyService {
  async calculateEntityScore(entityId: string) {
    // Kampanya metriklerini çek
    const res = await pool.query(
      `SELECT
        COUNT(*) AS total_campaigns,
        COUNT(*) FILTER (WHERE status IN ('response_received', 'resolved')) AS response_received,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_campaigns,
        COUNT(*) FILTER (WHERE status IN ('no_response', 'closed_unresolved')) AS ignored_campaigns,
        AVG(
          CASE
            WHEN status IN ('response_received', 'resolved')
              AND created_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
          END
        ) AS avg_response_days
       FROM campaigns
       WHERE entity_id = $1 AND status != 'pending'`,
      [entityId]
    );

    const row = res.rows[0];
    const total = parseInt(row.total_campaigns) || 0;
    if (total === 0) return null;

    const responseReceived = parseInt(row.response_received) || 0;
    const resolved = parseInt(row.resolved_campaigns) || 0;
    const ignored = parseInt(row.ignored_campaigns) || 0;
    const avgDays = row.avg_response_days ? Math.round(parseFloat(row.avg_response_days)) : null;

    const responseRate = total > 0 ? responseReceived / total : 0;
    const resolutionRate = total > 0 ? resolved / total : 0;

    // Response speed score
    let speedScore = 0;
    if (avgDays !== null) {
      if (avgDays <= 3) speedScore = 100;
      else if (avgDays <= 7) speedScore = 80;
      else if (avgDays <= 14) speedScore = 60;
      else if (avgDays <= 30) speedScore = 40;
      else speedScore = 20;
    }

    // Ignore penalty (0-1 scale)
    const ignorePenalty = total > 0 ? ignored / total : 0;

    // Final score
    const score = Math.round(
      (responseRate * 40) +
      (resolutionRate * 30) +
      (speedScore * 0.20) -
      (ignorePenalty * 10)
    );

    const finalScore = Math.max(0, Math.min(100, score));

    // Upsert
    await pool.query(
      `INSERT INTO entity_transparency_metrics
         (entity_id, total_campaigns, response_received, resolved_campaigns, ignored_campaigns, average_response_days, transparency_score, last_calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (entity_id) DO UPDATE SET
         total_campaigns = $2,
         response_received = $3,
         resolved_campaigns = $4,
         ignored_campaigns = $5,
         average_response_days = $6,
         transparency_score = $7,
         last_calculated_at = NOW()`,
      [entityId, total, responseReceived, resolved, ignored, avgDays, finalScore]
    );

    return {
      transparency_score: finalScore,
      total_campaigns: total,
      responses: responseReceived,
      resolved: resolved,
      ignored: ignored,
      avg_response_days: avgDays,
    };
  }

  async getScoreBySlug(slug: string) {
    const entity = (await pool.query('SELECT id FROM entities WHERE slug = $1', [slug])).rows[0];
    if (!entity) throw new Error('Kurum bulunamadı');

    const existing = (await pool.query(
      'SELECT * FROM entity_transparency_metrics WHERE entity_id = $1',
      [entity.id]
    )).rows[0];

    if (existing) {
      return {
        transparency_score: existing.transparency_score,
        total_campaigns: existing.total_campaigns,
        responses: existing.response_received,
        resolved: existing.resolved_campaigns,
        ignored: existing.ignored_campaigns,
        avg_response_days: existing.average_response_days,
      };
    }

    // Hesaplanmamışsa hesapla
    return this.calculateEntityScore(entity.id);
  }

  async recalculateAllEntities() {
    const entities = (await pool.query('SELECT id FROM entities')).rows;
    let processed = 0;
    for (const e of entities) {
      try {
        await this.calculateEntityScore(e.id);
        processed++;
      } catch {}
    }
    return { processed };
  }
}
