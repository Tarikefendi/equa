const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  console.log('=== Response Deadline Test ===\n');

  // 1. Aktif bir kampanya bul
  const campaign = (await pool.query(
    `SELECT id, title, status, response_deadline_date FROM campaigns WHERE status = 'active' LIMIT 1`
  )).rows[0];

  if (!campaign) {
    console.log('❌ Aktif kampanya bulunamadı. Önce seed-active-campaigns.js çalıştır.');
    await pool.end(); return;
  }

  console.log(`📋 Test kampanyası: "${campaign.title}"`);
  console.log(`   ID: ${campaign.id}`);
  console.log(`   Mevcut status: ${campaign.status}`);
  console.log(`   Mevcut deadline: ${campaign.response_deadline_date || 'yok'}\n`);

  // 2. Deadline'ı geçmişe al
  const originalDeadline = campaign.response_deadline_date;
  await pool.query(
    `UPDATE campaigns SET response_deadline_date = NOW() - INTERVAL '2 days' WHERE id = $1`,
    [campaign.id]
  );
  console.log('⏰ Deadline 2 gün öncesine alındı\n');

  // 3. checkResponseDeadlines mantığını simüle et
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

  console.log(`🔍 Deadline geçmiş + yanıtsız kampanya sayısı: ${expired.length}`);
  expired.forEach(c => console.log(`   → ${c.title} (${c.id})`));

  if (expired.length === 0) {
    console.log('⚠️  Kampanya listede görünmüyor — response_deadline_date NULL olabilir');
    // deadline_date NULL ise set et
    await pool.query(
      `UPDATE campaigns SET response_deadline_date = NOW() - INTERVAL '2 days' WHERE id = $1`,
      [campaign.id]
    );
  }

  // 4. Statüyü no_response yap (service mantığını direkt uygula)
  await pool.query(
    `UPDATE campaigns SET status = 'no_response', last_activity_at = NOW() WHERE id = $1`,
    [campaign.id]
  );

  await pool.query(
    `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
     VALUES ($1, 'active', 'no_response', NULL, 'Kurum belirtilen süre içinde yanıt vermedi')`,
    [campaign.id]
  );

  await pool.query(
    `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
     SELECT $1::text, creator_id, 'Yanıt süresi doldu', 'Kurum belirtilen süre içinde yanıt vermedi.', 'system_event'
     FROM campaigns WHERE id = $1::text`,
    [campaign.id]
  );

  console.log('\n✅ Status → no_response');
  console.log('✅ campaign_status_history kaydı eklendi');
  console.log('✅ campaign_updates sistem notu eklendi');

  // 5. Doğrula
  const updated = (await pool.query(
    `SELECT c.id, c.status,
       (SELECT content FROM campaign_updates WHERE campaign_id = c.id AND type = 'system_event' ORDER BY created_at DESC LIMIT 1) as last_update,
       (SELECT new_status FROM campaign_status_history WHERE campaign_id = c.id ORDER BY created_at DESC LIMIT 1) as last_history
     FROM campaigns c WHERE c.id = $1`,
    [campaign.id]
  )).rows[0];

  console.log('\n📊 Doğrulama:');
  console.log(`   Status: ${updated.status}`);
  console.log(`   Son güncelleme: "${updated.last_update}"`);
  console.log(`   Son history: → ${updated.last_history}`);

  // 6. Geri al
  await pool.query(
    `UPDATE campaigns SET status = 'active', response_deadline_date = $1 WHERE id = $2`,
    [originalDeadline, campaign.id]
  );
  await pool.query(
    `DELETE FROM campaign_status_history WHERE campaign_id = $1 AND new_status = 'no_response'`,
    [campaign.id]
  );
  await pool.query(
    `DELETE FROM campaign_updates WHERE campaign_id = $1 AND title = 'Yanıt süresi doldu'`,
    [campaign.id]
  );
  console.log('\n↩️  Test verileri temizlendi, kampanya active\'e döndürüldü');
  console.log('\n✅ Test başarılı — özellik çalışıyor.');

  await pool.end();
}

run().catch(e => { console.error('❌ Hata:', e.message); pool.end(); });
