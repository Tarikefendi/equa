const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(campaign_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign ON campaign_reports(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_reports_status ON campaign_reports(status);
  `);
  console.log('✅ campaign_reports tablosu oluşturuldu');
  await pool.end();
}

migrate().catch(console.error);
