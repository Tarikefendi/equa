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
  // "Kampanya başlatıldı" update'i olmayan kampanyaları bul
  const camps = await pool.query(`
    SELECT id, creator_id, created_at, title
    FROM campaigns
    WHERE id NOT IN (
      SELECT DISTINCT campaign_id FROM campaign_updates
      WHERE title ILIKE '%başlatıl%' OR title ILIKE '%baslatil%'
    )
  `);

  console.log(`${camps.rows.length} kampanyada başlatıldı update'i eksik`);

  for (const c of camps.rows) {
    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [c.id, c.creator_id, 'Kampanya başlatıldı', 'Bu kampanya kamuoyu desteği toplamak için başlatıldı.', c.created_at]
    );
    console.log('✅ Eklendi:', c.id.substring(0, 8), '-', c.title?.substring(0, 40));
  }

  await pool.end();
  console.log('Tamamlandı.');
}

run().catch(console.error);
