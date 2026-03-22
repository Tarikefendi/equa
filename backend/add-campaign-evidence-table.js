const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_evidence (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      type        TEXT NOT NULL CHECK (type IN ('link', 'document', 'image')),
      title       TEXT NOT NULL,
      description TEXT,
      url         TEXT,
      file_path   TEXT,
      added_by    TEXT REFERENCES users(id),
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_campaign_evidence_campaign_id ON campaign_evidence(campaign_id)');
  console.log('✅ campaign_evidence tablosu oluşturuldu');
  await pool.end();
}
main().catch(e => { console.error('HATA:', e.message); pool.end(); });
