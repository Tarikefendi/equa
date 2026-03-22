require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  // campaigns tablosuna views kolonu ekle
  await pool.query(`
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0
  `);
  console.log('✅ views column added to campaigns');

  // campaign_views tablosu: 1 saat dedupe için
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_views (
      id SERIAL PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      viewer_key TEXT NOT NULL,
      viewed_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_campaign_views_lookup
    ON campaign_views (campaign_id, viewer_key, viewed_at)
  `);
  console.log('✅ campaign_views table created');

  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
