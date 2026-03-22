const { Pool } = require('pg');

const local = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
const railway = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  try {
    // Migrate entities first
    const entities = await local.query('SELECT * FROM entities');
    for (const e of entities.rows) {
      await railway.query(`
        INSERT INTO entities (id, name, slug, type, description, website, country, verified, follower_count, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING
      `, [e.id, e.name, e.slug, e.type, e.description, e.website, e.country, e.verified, e.follower_count || 0, e.created_at]);
    }
    console.log(`✅ ${entities.rows.length} entity migrated`);

    // Migrate campaigns
    const campaigns = await local.query('SELECT * FROM campaigns ORDER BY created_at ASC');
    for (const c of campaigns.rows) {
      await railway.query(`
        INSERT INTO campaigns (id, title, description, summary, status, category, creator_id, entity_id, entity_name,
          is_public, investigation_mode, demanded_action, standard_reference, response_deadline_days, response_deadline_date,
          target_type, views, share_count, victory_at, victory_support_count, last_activity_at, resolution_reason, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
        ON CONFLICT (id) DO NOTHING
      `, [c.id, c.title, c.description, c.summary, c.status, c.category, c.creator_id, c.entity_id, c.entity_name,
          c.is_public ?? true, c.investigation_mode ?? false, c.demanded_action, c.standard_reference,
          c.response_deadline_days || 30, c.response_deadline_date, c.target_type || 'company',
          c.views || 0, c.share_count || 0, c.victory_at, c.victory_support_count,
          c.last_activity_at || c.created_at, c.resolution_reason, c.created_at, c.updated_at || c.created_at]);
    }
    console.log(`✅ ${campaigns.rows.length} campaign migrated`);

    // Migrate signatures
    const sigs = await local.query('SELECT * FROM signatures');
    for (const s of sigs.rows) {
      await railway.query(`
        INSERT INTO signatures (id, campaign_id, user_id, message, is_anonymous, created_at)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING
      `, [s.id, s.campaign_id, s.user_id, s.message, s.is_anonymous, s.created_at]);
    }
    console.log(`✅ ${sigs.rows.length} signature migrated`);

    // Migrate campaign_updates
    const updates = await local.query('SELECT * FROM campaign_updates ORDER BY id ASC');
    for (const u of updates.rows) {
      await railway.query(`
        INSERT INTO campaign_updates (id, campaign_id, user_id, type, title, content, source_url, is_pinned, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING
      `, [u.id, u.campaign_id, u.user_id, u.type, u.title, u.content, u.source_url, u.is_pinned, u.created_at, u.updated_at || u.created_at]);
    }
    console.log(`✅ ${updates.rows.length} campaign update migrated`);

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await local.end();
    await railway.end();
  }
}

migrate();
