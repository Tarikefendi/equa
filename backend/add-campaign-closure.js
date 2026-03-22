const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627'
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // last_activity_at kolonu
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW()
    `);

    // resolution_reason kolonu
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS resolution_reason TEXT
    `);

    // Mevcut kampanyalar için last_activity_at = updated_at
    await client.query(`
      UPDATE campaigns SET last_activity_at = COALESCE(updated_at, created_at)
      WHERE last_activity_at IS NULL
    `);

    await client.query('COMMIT');
    console.log('✅ Migration tamamlandı: last_activity_at, resolution_reason eklendi');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
