const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS investigation_mode BOOLEAN DEFAULT false
    `);
    console.log('✅ investigation_mode kolonu eklendi');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    pool.end();
  }
}

migrate();
