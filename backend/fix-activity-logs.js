const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action_type TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details JSONB DEFAULT '{}',
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ activity_logs tablosu oluşturuldu');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id)`);
    console.log('✅ indexler oluşturuldu');
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await pool.end();
  }
}

run();
