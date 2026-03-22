const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_update_history (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      update_id   INTEGER NOT NULL REFERENCES campaign_updates(id) ON DELETE CASCADE,
      old_title   TEXT,
      old_content TEXT NOT NULL,
      old_source_url TEXT,
      edited_by   TEXT,
      reason      TEXT,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_update_history_update_id ON campaign_update_history(update_id)');
  console.log('✅ campaign_update_history tablosu oluşturuldu');
  await pool.end();
}
main().catch(e => { console.error('HATA:', e.message); pool.end(); });
