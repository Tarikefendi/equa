const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entity_transparency_metrics (
        id SERIAL PRIMARY KEY,
        entity_id TEXT UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
        total_campaigns INTEGER DEFAULT 0,
        response_received INTEGER DEFAULT 0,
        resolved_campaigns INTEGER DEFAULT 0,
        ignored_campaigns INTEGER DEFAULT 0,
        average_response_days INTEGER,
        transparency_score INTEGER,
        last_calculated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ entity_transparency_metrics tablosu oluşturuldu');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    pool.end();
  }
}

migrate();
