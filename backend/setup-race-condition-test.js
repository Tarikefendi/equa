const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function main() {
  // --- 1. Yeni kullanıcı: avukat2 ---
  const lawyer2Email = 'lawyer2@example.com';
  const lawyer2Pass = await bcrypt.hash('12345678', 12);
  const lawyer2UserId = crypto.randomBytes(16).toString('hex');
  const lawyer2Username = 'avukat2';

  // Varsa sil
  await pool.query(`DELETE FROM lawyers WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [lawyer2Email]);
  await pool.query(`DELETE FROM users WHERE email = $1`, [lawyer2Email]);

  await pool.query(
    `INSERT INTO users (id, email, username, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, 'user', 1)`,
    [lawyer2UserId, lawyer2Email, lawyer2Username, lawyer2Pass]
  );
  await pool.query(`INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [lawyer2UserId]);

  // Avukat kaydı — doğrudan verified
  const lawyer2Id = crypto.randomBytes(16).toString('hex');
  await pool.query(
    `INSERT INTO lawyers (id, user_id, full_name, specializations, bar_number, city, is_verified, is_available)
     VALUES ($1, $2, $3, $4, $5, $6, 1, 1)`,
    [lawyer2Id, lawyer2UserId, 'Ayşe Kaya', 'Tüketici Hukuku', 'AKR-2024', 'Ankara']
  );
  console.log(`✓ Avukat2 oluşturuldu: ${lawyer2Email} / 12345678`);
  console.log(`  lawyer_id: ${lawyer2Id}`);

  // --- 2. Yeni kampanya ---
  const campId = crypto.randomBytes(16).toString('hex');

  // Kampanya sahibi kullanıcısını bul
  const ownerRes = await pool.query(`SELECT id FROM users WHERE email = 'campaignowner@example.com'`);
  const ownerId = ownerRes.rows[0]?.id;
  if (!ownerId) throw new Error('campaignowner@example.com bulunamadı');

  // Entity bul
  const entityRes = await pool.query(`SELECT id FROM entities LIMIT 1`);
  const entityId = entityRes.rows[0]?.id || null;

  await pool.query(
    `INSERT INTO campaigns (id, title, description, status, creator_id, entity_id,
      target_entity, target_type, category,
      response_deadline_days, response_deadline_date, created_at, last_activity_at)
     VALUES ($1, $2, $3, 'no_response', $4, $5, 'Test Kurumu', 'company', 'consumer_rights', 30,
       NOW() - INTERVAL '35 days',
       NOW() - INTERVAL '35 days',
       NOW() - INTERVAL '35 days')`,
    [campId,
     'Race Condition Test Kampanyası',
     'Bu kampanya race condition testini yapmak için oluşturuldu.',
     ownerId, entityId]
  );
  console.log(`✓ Kampanya oluşturuldu: "${campId}"`);

  // 55 imza ekle — admin user_id'yi tekrar kullan (is_anonymous=true)
  const adminRes = await pool.query(`SELECT id FROM users WHERE email = 'testlogin@example.com'`);
  const adminId = adminRes.rows[0].id;
  // Tek bir imza yeterli değil, count sorgusu kullanıyoruz — fake count için view trick
  // Bunun yerine direkt signatures tablosuna tek kayıt + view_count manipülasyonu yapalım
  // Aslında getLegalStatus support_count için signatures tablosunu sayıyor
  // Farklı fake user'lar yerine, mevcut kullanıcıları kullanalım
  const users = await pool.query(`SELECT id FROM users LIMIT 60`);
  let inserted = 0;
  for (const u of users.rows) {
    if (inserted >= 55) break;
    const sigId = crypto.randomBytes(16).toString('hex');
    try {
      await pool.query(
        `INSERT INTO signatures (id, campaign_id, user_id, is_anonymous, created_at)
         VALUES ($1, $2, $3, true, NOW() - INTERVAL '${inserted} hours')`,
        [sigId, campId, u.id]
      );
      inserted++;
    } catch {}
  }
  console.log(`✓ ${inserted} imza eklendi`);

  // Legal request oluştur (kampanya sahibi talep etmiş gibi)
  const lrId = crypto.randomBytes(16).toString('hex');
  await pool.query(
    `INSERT INTO legal_requests (id, campaign_id, requester_id, status) VALUES ($1, $2, $3, 'pending')`,
    [lrId, campId, ownerId]
  );
  console.log(`✓ Legal request oluşturuldu: ${lrId}`);

  // --- Özet ---
  console.log('\n=== RACE CONDITION TEST HAZIR ===');
  console.log(`Kampanya ID  : ${campId}`);
  console.log(`Kampanya URL : http://localhost:3000/campaigns/${campId}`);
  console.log(`Legal Req ID : ${lrId}`);
  console.log('\nAvukat 1: campaignowner@example.com / 12345678');
  console.log(`Avukat 2: ${lawyer2Email} / 12345678`);
  console.log('\nTest endpoint:');
  console.log(`  POST http://localhost:5000/api/v1/legal-requests/${lrId}/apply`);

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
