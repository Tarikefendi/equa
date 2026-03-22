require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_followers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(campaign_id, user_id)
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_followers_campaign ON campaign_followers(campaign_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_followers_user ON campaign_followers(user_id)`);

  console.log('campaign_followers table ready');
  await pool.end();
}

main().catch(console.error);
