const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const fixes = [
    // campaigns eksik kolonlar
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_entity TEXT`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{}'`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS evidence TEXT`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS standard_reference_other TEXT`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS response_deadline_days INTEGER DEFAULT 30`,
    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tags TEXT[]`,
    // campaign_updates eksik kolon (author_id vs user_id)
    `ALTER TABLE campaign_updates ADD COLUMN IF NOT EXISTS author_id TEXT REFERENCES users(id) ON DELETE SET NULL`,
    // campaign_updates type constraint güncelle (system tipi ekle)
    `ALTER TABLE campaign_updates DROP CONSTRAINT IF EXISTS campaign_updates_type_check`,
    `ALTER TABLE campaign_updates ADD CONSTRAINT campaign_updates_type_check 
     CHECK (type IN ('general','media','official_response','status_change','lawyer_matched','system'))`,
  ];

  for (const sql of fixes) {
    try {
      await pool.query(sql);
      console.log('✅', sql.substring(0, 70));
    } catch (e) {
      console.error('❌', e.message.substring(0, 100));
    }
  }

  await pool.end();
  console.log('\nTamamlandı.');
}

run();
