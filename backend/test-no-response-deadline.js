const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Test için: aktif bir kampanyanın deadline'ını geçmişe al
  const campaign = (await pool.query(
    `SELECT id, title, status, response_deadline_date FROM campaigns WHERE status = 'active' LIMIT 1`
  )).rows[0];

  if (!campaign) {
    console.log('❌ Aktif kampanya bulunamadı');
    await pool.end();
    return;
  }

  console.log(`📋 Test kampanyası: ${campaign.title} (${campaign.id})`);
  console.log(`   Mevcut deadline: ${campaign.response_deadline_date}`);

  // Deadline'ı 1 gün öncesine al
  await pool.query(
    `UPDATE campaigns SET response_deadline_date = NOW() - INTERVAL '1 day' WHERE id = $1`,
    [campaign.id]
  );
  console.log('✅ Deadline 1 gün öncesine alındı');

  // Deadline kontrolünü simüle et
  const expired = (await pool.query(
    `SELECT c.id, c.title FROM campaigns c
     WHERE c.status = 'active'
       AND c.response_deadline_date IS NOT NULL
       AND c.response_deadline_date < NOW()
       AND NOT EXISTS (
         SELECT 1 FROM campaign_updates cu
         WHERE cu.campaign_id = c.id AND cu.type = 'official_response'
       )`
  )).rows;

  console.log(`\n🔍 Deadline geçmiş ve yanıtsız kampanya sayısı: ${expired.length}`);
  expired.forEach(c => console.log(`   - ${c.title} (${c.id})`));

  // Geri al
  await pool.query(
    `UPDATE campaigns SET response_deadline_date = $1 WHERE id = $2`,
    [campaign.response_deadline_date, campaign.id]
  );
  console.log('\n↩️  Deadline eski değerine geri alındı');
  console.log('\n✅ Backend restart sonrası cron job bu kampanyaları otomatik işleyecek.');

  await pool.end();
}

run().catch(e => { console.error(e); pool.end(); });
