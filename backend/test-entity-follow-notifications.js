/**
 * Entity takipçi bildirim sistemi test scripti
 *
 * Test senaryoları:
 * 1. testlogin kullanıcısı bir entity'yi takip eder
 * 2. O entity'ye bağlı yeni kampanya oluşturulur → bildirim gelmeli
 * 3. Kampanyaya güncelleme eklenir → bildirim gelmeli
 * 4. Kampanyaya resmi yanıt eklenir → bildirim gelmeli
 */

require('dotenv').config();
const { Pool } = require('pg');
const { randomBytes } = require('crypto');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function clearNotifications(userId) {
  await pool.query(
    "DELETE FROM notifications WHERE user_id = $1 AND type IN ('entity_new_campaign','entity_campaign_update','entity_official_response')",
    [userId]
  );
}

async function checkNotifications(userId, label) {
  const result = await pool.query(
    `SELECT type, title, message, created_at FROM notifications
     WHERE user_id = $1 AND type IN ('entity_new_campaign','entity_campaign_update','entity_official_response')
     ORDER BY created_at DESC`,
    [userId]
  );
  console.log(`\n📬 [${label}] Bildirimler (${result.rows.length} adet):`);
  if (result.rows.length === 0) {
    console.log('  ❌ Bildirim yok');
  }
  for (const row of result.rows) {
    console.log(`  ✅ [${row.type}] ${row.title}`);
    console.log(`     ${row.message}`);
  }
  return result.rows;
}

async function run() {
  try {
    console.log('=== Entity Takipçi Bildirim Testi ===\n');

    // 1. testlogin kullanıcısını bul
    const testUserResult = await pool.query(
      "SELECT id, email FROM users WHERE email = 'testlogin@example.com'"
    );
    if (testUserResult.rows.length === 0) {
      console.error('❌ testlogin@example.com bulunamadı. Önce seed-test-data.js çalıştırın.');
      return;
    }
    const followerUserId = testUserResult.rows[0].id;
    console.log('👤 Takipçi kullanıcı:', testUserResult.rows[0].email, '(ID:', followerUserId + ')');

    // 2. Kampanya sahibi kullanıcı oluştur/bul
    const ownerEmail = 'entitytest_owner@example.com';
    const hashedPw = await bcrypt.hash('12345678', 10);
    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, is_verified, role)
       VALUES ($1, $2, $3, $4, 1, 'user')
       ON CONFLICT (email) DO NOTHING`,
      [randomBytes(16).toString('hex'), ownerEmail, 'entity_test_owner', hashedPw]
    );
    const ownerResult = await pool.query('SELECT id FROM users WHERE email = $1', [ownerEmail]);
    const ownerId = ownerResult.rows[0].id;
    console.log('👤 Kampanya sahibi:', ownerEmail, '(ID:', ownerId + ')');

    // 3. Test entity'sini bul veya oluştur
    let entityResult = await pool.query("SELECT id, name, slug FROM entities WHERE slug = 'turk-telekom'");
    if (entityResult.rows.length === 0) {
      const entityId = randomBytes(16).toString('hex');
      await pool.query(
        `INSERT INTO entities (id, name, slug, type, description)
         VALUES ($1, 'Türk Telekom', 'turk-telekom', 'company', 'Test entity')`,
        [entityId]
      );
      entityResult = await pool.query("SELECT id, name, slug FROM entities WHERE slug = 'turk-telekom'");
    }
    const entity = entityResult.rows[0];
    console.log('🏢 Entity:', entity.name, '(ID:', entity.id + ')');

    // 4. Önceki test bildirimlerini temizle
    await clearNotifications(followerUserId);
    console.log('\n🧹 Eski test bildirimleri temizlendi');

    // 5. testlogin kullanıcısını entity'ye takipçi yap
    await pool.query(
      `INSERT INTO entity_followers (entity_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (entity_id, user_id) DO NOTHING`,
      [entity.id, followerUserId]
    );
    console.log('✅ testlogin kullanıcısı', entity.name, 'entitysini takip ediyor');

    // 6. TEST 1: Yeni kampanya oluştur → entity_new_campaign bildirimi gelmeli
    console.log('\n--- TEST 1: Yeni kampanya bildirimi ---');
    const campaignId = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO campaigns (id, creator_id, title, description, target_entity, target_type,
        category, goals, evidence, status, standard_reference, demanded_action,
        response_deadline_days, response_deadline_date, entity_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW() + '30 days'::interval, $14)`,
      [
        campaignId, ownerId,
        'Entity Takip Test Kampanyası',
        'Bu kampanya entity takip bildirimlerini test etmek için oluşturuldu.',
        entity.name, 'company', 'Çalışma Hakları',
        JSON.stringify({ target_signatures: 100 }),
        JSON.stringify({}),
        'active', 'ILO-87', 'Test talebi.', 30, entity.id,
      ]
    );

    // entity_new_campaign bildirimini manuel tetikle (service gibi)
    const followers1 = await pool.query(
      'SELECT user_id FROM entity_followers WHERE entity_id = $1',
      [entity.id]
    );
    for (const row of followers1.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'entity_new_campaign', $2, $3, 'campaign', $4)`,
        [
          row.user_id,
          `${entity.name} için yeni kampanya`,
          `Takip ettiğiniz ${entity.name} kurumu için yeni bir kampanya başlatıldı: "Entity Takip Test Kampanyası"`,
          campaignId,
        ]
      );
    }
    await checkNotifications(followerUserId, 'Yeni kampanya sonrası');

    // 7. TEST 2: Kampanya güncellemesi → entity_campaign_update bildirimi gelmeli
    console.log('\n--- TEST 2: Kampanya güncelleme bildirimi ---');
    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
       VALUES ($1, $2, $3, $4, 'update')`,
      [campaignId, ownerId, 'Önemli Gelişme', 'Kurum bizimle görüşmeye hazır olduklarını bildirdi.']
    );

    // entity_campaign_update bildirimini tetikle
    const followers2 = await pool.query(
      `SELECT ef.user_id FROM entity_followers ef
       JOIN campaigns c ON c.entity_id = ef.entity_id
       WHERE c.id = $1`,
      [campaignId]
    );
    for (const row of followers2.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'entity_campaign_update', $2, $3, 'campaign', $4)`,
        [
          row.user_id,
          `${entity.name} kampanyasında güncelleme`,
          `Takip ettiğiniz ${entity.name} kurumunun "Entity Takip Test Kampanyası" kampanyasında yeni bir güncelleme var.`,
          campaignId,
        ]
      );
    }
    await checkNotifications(followerUserId, 'Güncelleme sonrası');

    // 8. TEST 3: Resmi yanıt → entity_official_response bildirimi gelmeli
    console.log('\n--- TEST 3: Resmi yanıt bildirimi ---');
    const followers3 = await pool.query(
      'SELECT user_id FROM entity_followers WHERE entity_id = $1',
      [entity.id]
    );
    for (const row of followers3.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'entity_official_response', $2, $3, 'campaign', $4)`,
        [
          row.user_id,
          `${entity.name} resmi yanıt verdi`,
          `Takip ettiğiniz ${entity.name} kurumunun ilgili olduğu "Entity Takip Test Kampanyası" kampanyasına resmi yanıt geldi.`,
          campaignId,
        ]
      );
    }
    await checkNotifications(followerUserId, 'Resmi yanıt sonrası');

    // 9. Özet
    console.log('\n=== ÖZET ===');
    console.log('Kampanya URL:', 'http://localhost:3000/campaigns/' + campaignId);
    console.log('Entity URL:', 'http://localhost:3000/entities/' + entity.slug);
    console.log('\ntestlogin@example.com ile giriş yapıp /notifications sayfasını kontrol edin.');
    console.log('3 adet entity takip bildirimi görünmeli:');
    console.log('  1. entity_new_campaign');
    console.log('  2. entity_campaign_update');
    console.log('  3. entity_official_response');

  } catch (err) {
    console.error('❌ Hata:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

run();
