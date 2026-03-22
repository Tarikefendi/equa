import pool from '../config/database';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class EntityService {
  async getMostActive(limit = 5) {
    const result = await pool.query(
      `SELECT e.id, e.name, e.slug, e.type, e.verified,
              COUNT(c.id) as campaign_count
       FROM entities e
       JOIN campaigns c ON c.entity_id = e.id
       WHERE c.created_at >= NOW() - INTERVAL '30 days'
         AND c.status NOT IN ('draft', 'under_review')
       GROUP BY e.id
       ORDER BY campaign_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async search(query: string) {
    const result = await pool.query(
      `SELECT e.id, e.name, e.slug, e.type, e.description, e.website, e.country, e.verified,
              COUNT(DISTINCT ef.id) as follower_count,
              COUNT(DISTINCT c.id) as campaign_count,
              COALESCE(SUM(sig_counts.sig_count), 0) as total_support
       FROM entities e
       LEFT JOIN entity_followers ef ON ef.entity_id = e.id
       LEFT JOIN campaigns c ON c.entity_id = e.id AND c.status NOT IN ('draft', 'under_review')
       LEFT JOIN (
         SELECT campaign_id, COUNT(*) as sig_count FROM signatures GROUP BY campaign_id
       ) sig_counts ON sig_counts.campaign_id = c.id
       WHERE e.name ILIKE $1
       GROUP BY e.id
       ORDER BY campaign_count DESC, e.name ASC
       LIMIT 50`,
      [`%${query}%`]
    );
    return result.rows;
  }

  async getBySlug(slug: string) {
    const entity = (await pool.query(
      `SELECT e.*, COUNT(ef.id) as follower_count
       FROM entities e
       LEFT JOIN entity_followers ef ON ef.entity_id = e.id
       WHERE e.slug = $1
       GROUP BY e.id`,
      [slug]
    )).rows[0];
    if (!entity) return null;

    const campaigns = (await pool.query(
      `SELECT c.id, c.title, c.status, c.category, c.case_number, c.created_at,
              (SELECT COUNT(*) FROM signatures WHERE campaign_id = c.id) as signature_count
       FROM campaigns c
       WHERE c.entity_id = $1 AND c.status NOT IN ('draft', 'under_review')
       ORDER BY c.created_at DESC`,
      [entity.id]
    )).rows;

    const stats = campaigns.reduce((acc: any, c: any) => {
      acc.total++;
      acc[c.status] = (acc[c.status] || 0) + 1;
      if (!['response_received', 'resolved', 'concluded'].includes(c.status)) {
        acc.unanswered = (acc.unanswered || 0) + 1;
      }
      return acc;
    }, { total: 0, unanswered: 0 });

    // Son aktivite: campaign_updates.created_at max, yoksa campaigns.created_at max
    const lastActivityResult = await pool.query(
      `SELECT GREATEST(
         MAX(cu.created_at),
         MAX(c.created_at)
       ) as last_activity
       FROM campaigns c
       LEFT JOIN campaign_updates cu ON cu.campaign_id = c.id
       WHERE c.entity_id = $1`,
      [entity.id]
    );
    const last_activity = lastActivityResult.rows[0]?.last_activity || null;

    return { entity, campaigns, stats, last_activity };
  }

  async getById(id: string) {
    const result = await pool.query(
      'SELECT * FROM entities WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getAll() {
    const result = await pool.query(
      `SELECT e.*, COUNT(ef.id) as follower_count
       FROM entities e
       LEFT JOIN entity_followers ef ON ef.entity_id = e.id
       GROUP BY e.id
       ORDER BY e.name ASC`
    );
    return result.rows;
  }

  async setVerified(entityId: string, verified: boolean) {
    const result = await pool.query(
      'UPDATE entities SET verified = $1 WHERE id = $2 RETURNING *',
      [verified, entityId]
    );
    if (!result.rows[0]) throw new Error('Entity not found');
    return result.rows[0];
  }

  async create(data: {
    name: string;
    type?: string;
    description?: string;
    website?: string;
    country?: string;
  }) {
    const baseSlug = toSlug(data.name);
    // Slug çakışmasını önle
    let slug = baseSlug;
    const existing = await pool.query('SELECT id FROM entities WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const allowedTypes = ['company', 'government', 'organization', 'person', 'other'];
    const entityType = data.type && allowedTypes.includes(data.type) ? data.type : null;

    const result = await pool.query(
      `INSERT INTO entities (name, slug, type, description, website, country)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.name, slug, entityType, data.description || null, data.website || null, data.country || null]
    );
    return result.rows[0];
  }
}
