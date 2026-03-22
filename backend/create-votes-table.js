const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote_choice TEXT NOT NULL CHECK (vote_choice IN ('support', 'oppose', 'neutral')),
        vote_hash TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id, user_id)
      )
    `);
    console.log('✅ votes table created');
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await pool.end();
  }
}

run();
