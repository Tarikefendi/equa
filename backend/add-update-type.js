const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  // 1. Kolonu ekle
  await pool.query(`
    ALTER TABLE campaign_updates
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'update'
  `);
  console.log('✅ type kolonu eklendi');

  // 2. "Durum güncellendi" başlıklı kayıtları status_change yap
  const r1 = await pool.query(`
    UPDATE campaign_updates SET type = 'status_change'
    WHERE title = 'Durum güncellendi'
  `);
  console.log(`✅ ${r1.rowCount} kayıt → status_change`);

  // 3. "Kampanya başlatıldı" başlıklı kayıtları system yap
  const r2 = await pool.query(`
    UPDATE campaign_updates SET type = 'system'
    WHERE title ILIKE '%başlatıl%' OR title ILIKE '%baslatil%'
  `);
  console.log(`✅ ${r2.rowCount} kayıt → system`);

  await pool.end();
  console.log('Tamamlandı.');
}

run().catch(console.error);
