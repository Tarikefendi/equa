const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS entity_metrics (
        id SERIAL PRIMARY KEY,
        entity_id TEXT UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
        campaign_count INTEGER DEFAULT 0,
        response_count INTEGER DEFAULT 0,
        resolved_count INTEGER DEFAULT 0,
        no_response_count INTEGER DEFAULT 0,
        avg_response_time_days INTEGER,
        response_rate FLOAT,
        last_calculated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query('COMMIT');
    console.log('✅ entity_metrics tablosu oluşturuldu');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Hata:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
