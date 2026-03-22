const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function migrate() {
  // 1. share_count kolonu
  await pool.query(`
    ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0
  `);
  console.log('✅ share_count column added');

  // 2. campaign_shares tablosu
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_shares (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
      platform VARCHAR(50) NOT NULL DEFAULT 'other',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_shares_campaign_id ON campaign_shares(campaign_id)`);
  console.log('✅ campaign_shares table created');

  await pool.end();
  console.log('Migration complete.');
}

migrate().catch(e => { console.error(e.message); pool.end(); });
