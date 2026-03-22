const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0`);
    console.log('✅ reputation_score eklendi');
    await pool.query(`UPDATE users SET reputation_score = COALESCE(reputation, 0) WHERE reputation_score = 0`);
    console.log('✅ Mevcut reputation değerleri kopyalandı');
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await pool.end();
  }
}

run();
