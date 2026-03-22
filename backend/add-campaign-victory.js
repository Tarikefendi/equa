const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS victory_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS victory_support_count INTEGER
    `);
    console.log('✅ victory_at ve victory_support_count kolonları eklendi');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    pool.end();
  }
}

migrate();
