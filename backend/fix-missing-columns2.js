const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const fixes = [
    // campaigns eksik kolonlar
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS case_number TEXT",
    // entities eksik kolonlar
    "ALTER TABLE entities ADD COLUMN IF NOT EXISTS description TEXT",
    "ALTER TABLE entities ADD COLUMN IF NOT EXISTS website TEXT",
    "ALTER TABLE entities ADD COLUMN IF NOT EXISTS country TEXT",
    "ALTER TABLE entities ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false",
    "ALTER TABLE entities ADD COLUMN IF NOT EXISTS type TEXT",
    // entity_followers tablosu
    `CREATE TABLE IF NOT EXISTS entity_followers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(entity_id, user_id)
    )`,
    // campaign_updates tablosu
    `CREATE TABLE IF NOT EXISTS campaign_updates (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      title TEXT,
      content TEXT NOT NULL,
      source_url TEXT,
      is_pinned BOOLEAN DEFAULT false,
      edit_history JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
  ];

  for (const sql of fixes) {
    try {
      await p.query(sql);
      console.log('✅', sql.substring(0, 70));
    } catch (e) {
      console.error('❌', e.message.substring(0, 100));
    }
  }

  await p.end();
}

run();
