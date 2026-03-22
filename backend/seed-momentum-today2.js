const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const campaignId = '19c78d62-7e4e-4373-8bc3-e65a69b6b860'; // Migros indirim şeffaflığı

  // Signatures tablosunun unique constraint'ini kontrol et
  const constraintRes = await pool.query(
    "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'signatures' AND constraint_type = 'UNIQUE'"
  );
  console.log('Unique constraints:', constraintRes.rows);

  // Gerçek kullanıcıları al
  const usersRes = await pool.query('SELECT id FROM users LIMIT 20');
  const users = usersRes.rows;
  console.log(`${users.length} kullanıcı bulundu`);

  // Her kullanıcı için imza ekle (zaten imzalamışsa atla)
  let sigCount = 0;
  for (const u of users) {
    try {
      await pool.query(
        `INSERT INTO signatures (campaign_id, user_id, is_anonymous, created_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT DO NOTHING`,
        [campaignId, u.id]
      );
      sigCount++;
    } catch (e) {
      console.log('sig error:', e.message);
    }
  }
  console.log(`✅ ${sigCount} imza eklendi`);

  // Paylaşım ekle — unique constraint yok, direkt ekle
  const platforms = ['whatsapp', 'x', 'telegram', 'copy_link'];
  let shareCount = 0;
  for (let i = 0; i < 23; i++) {
    const u = users[i % users.length];
    try {
      await pool.query(
        `INSERT INTO campaign_shares (campaign_id, user_id, platform, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [campaignId, u.id, platforms[i % platforms.length]]
      );
      shareCount++;
    } catch (e) {
      console.log('share error:', e.message);
    }
  }
  console.log(`✅ ${shareCount} paylaşım eklendi`);

  // Sonuç
  const res = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1) AS total_supporters,
      (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_supporters,
      (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1) AS total_shares,
      (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_shares`,
    [campaignId]
  );
  console.log('\n📊 Momentum:', res.rows[0]);
  console.log(`\n🔗 http://localhost:3000/campaigns/${campaignId}`);

  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
