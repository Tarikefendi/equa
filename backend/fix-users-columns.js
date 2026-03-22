const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const fixes = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`,
    // password_hash → password alias (backend password_hash kullanıyor olabilir)
  ];

  for (const sql of fixes) {
    try {
      await pool.query(sql);
      console.log('✅', sql.substring(0, 70));
    } catch (e) {
      console.error('❌', e.message.substring(0, 100));
    }
  }

  // password_hash'i password'a kopyala (eğer password boşsa)
  await pool.query(`UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL`).catch(() => {});

  await pool.end();
  console.log('Tamamlandı.');
}

run();
