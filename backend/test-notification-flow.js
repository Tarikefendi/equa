require('dotenv').config();
const { Pool } = require('pg');
const { randomBytes } = require('crypto');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    // 1. Yeni kullanici olustur (kampanya sahibi)
    const newUserId = randomBytes(16).toString('hex');
    const hashedPw = await bcrypt.hash('12345678', 12);

    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, is_verified, role)
       VALUES ($1, $2, $3, $4, 1, 'user')
       ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id RETURNING id`,
      [newUserId, 'campaignowner@example.com', 'kampanya_sahibi', hashedPw]
    );

    const ownerResult = await pool.query(
      "SELECT id FROM users WHERE email = 'campaignowner@example.com'"
    );
    const ownerId = ownerResult.rows[0].id;
    console.log('Kampanya sahibi ID:', ownerId);

    // 2. testlogin kullanicisini bul
    const testUser = await pool.query(
      "SELECT id FROM users WHERE email = 'testlogin@example.com'"
    );
    const testUserId = testUser.rows[0].id;
    console.log('Test kullanici ID:', testUserId);

    // 3. Kampanya olustur (kampanya sahibi tarafindan)
    const campaignId = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO campaigns (id, creator_id, title, description, target_entity, target_type,
        category, goals, evidence, status, standard_reference, demanded_action,
        response_deadline_days, response_deadline_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW() + '30 days'::interval)`,
      [
        campaignId, ownerId,
        'Bildirim Test Kampanyasi',
        'Bu kampanya bildirim sistemini test etmek icin olusturuldu.',
        'Test Sirketi',
        'company',
        'Calisma Haklari',
        JSON.stringify({ target_signatures: 500 }),
        JSON.stringify({}),
        'active',
        'ILO-87',
        'Test talebimiz.',
        30,
      ]
    );
    console.log('Kampanya olusturuldu:', campaignId);

    // 4. testlogin kullanicisi kampanyayi imzalasin
    const sigId = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO signatures (id, campaign_id, user_id, is_anonymous)
       VALUES ($1, $2, $3, false)
       ON CONFLICT DO NOTHING`,
      [sigId, campaignId, testUserId]
    );
    console.log('testlogin kampanyayi imzaladi');

    // 5. Kampanya sahibi guncelleme eklesin (bildirim tetiklensin)
    const updateResult = await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [campaignId, ownerId, 'Onemli Gelisme', 'Sirket bizimle gorusmeye hazir olduklarini bildirdi!']
    );
    const updateId = updateResult.rows[0].id;
    console.log('Guncelleme eklendi, ID:', updateId);

    // 6. Bildirimi manuel olustur (service uzerinden degil, direkt)
    const notifId = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        notifId,
        testUserId,
        'campaign_update',
        'Kampanya guncellendi: Bildirim Test Kampanyasi',
        '"Onemli Gelisme" — Sirket bizimle gorusmeye hazir olduklarini bildirdi!',
        'campaign',
        campaignId,
      ]
    );
    console.log('Bildirim olusturuldu!');

    // 7. Kontrol
    const notif = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 AND type = 'campaign_update' ORDER BY created_at DESC LIMIT 1",
      [testUserId]
    );
    console.log('\nBildirim kaydi:');
    console.log(JSON.stringify(notif.rows[0], null, 2));

    console.log('\n--- TEST BILGILERI ---');
    console.log('Kampanya URL:', 'http://localhost:3000/campaigns/' + campaignId);
    console.log('testlogin ile giris yap ve /notifications sayfasini kontrol et');
    console.log('Email: testlogin@example.com | Sifre: 12345678');

  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

run();
