const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const alterations = [
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_type TEXT",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS investigation_mode BOOLEAN DEFAULT false",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS victory_at TIMESTAMP",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS victory_support_count INTEGER",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW()",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS resolution_reason TEXT",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS response_deadline_date TIMESTAMP",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS demanded_action TEXT",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS standard_reference TEXT",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS standard_id TEXT",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS summary TEXT",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true",
  ];

  for (const sql of alterations) {
    try {
      await pool.query(sql);
      console.log('✅', sql.substring(0, 60));
    } catch (e) {
      console.error('❌', e.message.substring(0, 80));
    }
  }

  // Set all existing campaigns to public visibility
  await pool.query("UPDATE campaigns SET visibility = 'public' WHERE visibility IS NULL");
  console.log('✅ Updated existing campaigns visibility to public');

  await pool.end();
}

run();
