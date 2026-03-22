import pool from '../config/database';
import logger from '../config/logger';

export class EntityMetricsService {
  async calculateForEntity(entityId: number): Promise<void> {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS campaign_count,
        COUNT(*) FILTER (WHERE status = 'response_received') AS response_count,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'no_response') AS no_response_count,
        AVG(
          EXTRACT(EPOCH FROM (
            SELECT MIN(cu.created_at)
            FROM campaign_updates cu
            WHERE cu.campaign_id = c.id AND cu.type = 'official_response'
          ) - c.created_at) / 86400
        ) AS avg_response_time_days
      FROM campaigns c
      WHERE c.entity_id = $1
    `, [entityId]);

    const row = result.rows[0];
    const campaignCount = parseInt(row.campaign_count) || 0;
    const responseCount = parseInt(row.response_count) || 0;
    const resolvedCount = parseInt(row.resolved_count) || 0;
    const noResponseCount = parseInt(row.no_response_count) || 0;
    const avgResponseTimeDays = row.avg_response_time_days ? Math.round(parseFloat(row.avg_response_time_days)) : null;
    const responseRate = campaignCount > 0 ? responseCount / campaignCount : 0;

    await pool.query(`
      INSERT INTO entity_metrics
        (entity_id, campaign_count, response_count, resolved_count, no_response_count, avg_response_time_days, response_rate, last_calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (entity_id) DO UPDATE SET
        campaign_count = EXCLUDED.campaign_count,
        response_count = EXCLUDED.response_count,
        resolved_count = EXCLUDED.resolved_count,
        no_response_count = EXCLUDED.no_response_count,
        avg_response_time_days = EXCLUDED.avg_response_time_days,
        response_rate = EXCLUDED.response_rate,
        last_calculated_at = NOW()
    `, [entityId, campaignCount, responseCount, resolvedCount, noResponseCount, avgResponseTimeDays, responseRate]);
  }

  async recalculateAll(): Promise<{ processed: number }> {
    const entities = (await pool.query('SELECT id FROM entities')).rows;
    logger.info(`EntityMetrics: recalculating for ${entities.length} entities`);

    for (const entity of entities) {
      try {
        await this.calculateForEntity(entity.id);
      } catch (err) {
        logger.error(`EntityMetrics: failed for entity ${entity.id}:`, err);
      }
    }

    return { processed: entities.length };
  }

  async getMetricsBySlug(slug: string): Promise<{
    campaign_count: number;
    response_count: number;
    resolved_count: number;
    no_response_count: number;
    response_rate: number;
    avg_response_time_days: number | null;
    metrics_available: boolean;
  }> {
    const result = await pool.query(`
      SELECT em.*
      FROM entity_metrics em
      JOIN entities e ON e.id = em.entity_id
      WHERE e.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return {
        campaign_count: 0,
        response_count: 0,
        resolved_count: 0,
        no_response_count: 0,
        response_rate: 0,
        avg_response_time_days: null,
        metrics_available: false,
      };
    }

    const m = result.rows[0];
    const campaignCount = parseInt(m.campaign_count) || 0;

    return {
      campaign_count: campaignCount,
      response_count: parseInt(m.response_count) || 0,
      resolved_count: parseInt(m.resolved_count) || 0,
      no_response_count: parseInt(m.no_response_count) || 0,
      response_rate: parseFloat(m.response_rate) || 0,
      avg_response_time_days: m.avg_response_time_days ? parseInt(m.avg_response_time_days) : null,
      metrics_available: campaignCount >= 3,
    };
  }
}
