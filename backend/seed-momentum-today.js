const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Active kampanya bul
  const campRes = await pool.query("SELECT id, title FROM campaigns WHERE status = 'active' LIMIT 1");
  if (!campRes.rows.length) { console.log('❌ Active kampanya yok'); pool.end(); return; }
  const campaign = campRes.rows[0];
  console.log(`📌 Kampanya: "${campaign.title}" (${campaign.id})`);

  // Kullanıcıları al
  const usersRes = await pool.query('SELECT id FROM users LIMIT 10');
  const users = usersRes.rows;

  // Bugün 47 imza ekle (farklı kullanıcılar simüle etmek için uuid üret)
  const { randomUUID } = require('crypto');
  let sigCount = 0;
  for (let i = 0; i < 47; i++) {
    const fakeUserId = randomUUID();
    try {
      await pool.query(
        `INSERT INTO signatures (campaign_id, user_id, is_anonymous, created_at)
         VALUES ($1, $2, true, NOW() - (random() * interval '8 hours'))`,
        [campaign.id, fakeUserId]
      );
      sigCount++;
    } catch {}
  }
  console.log(`✅ ${sigCount} imza eklendi (bugün)`);

  // Bugün 23 paylaşım ekle
  const platforms = ['whatsapp', 'x', 'telegram', 'copy_link'];
  let shareCount = 0;
  for (let i = 0; i < 23; i++) {
    const fakeUserId = randomUUID();
    const platform = platforms[i % platforms.length];
    try {
      await pool.query(
        `INSERT INTO campaign_shares (campaign_id, user_id, platform, created_at)
         VALUES ($1, $2, $3, NOW() - (random() * interval '6 hours'))`,
        [campaign.id, fakeUserId, platform]
      );
      shareCount++;
    } catch {}
  }
  console.log(`✅ ${shareCount} paylaşım eklendi (bugün)`);

  // Sonucu göster
  const res = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1) AS total_supporters,
      (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_supporters,
      (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1) AS total_shares,
      (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_shares`,
    [campaign.id]
  );
  console.log('\n📊 Güncel momentum:', res.rows[0]);
  console.log(`\n🔗 Kampanya linki: http://localhost:3000/campaigns/${campaign.id}`);

  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
