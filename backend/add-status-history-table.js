const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by TEXT REFERENCES users(id),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_status_history_campaign ON campaign_status_history(campaign_id);
  `);
  console.log('✅ campaign_status_history tablosu oluşturuldu');
  await pool.end();
}

migrate().catch(console.error);
