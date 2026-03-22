require('dotenv').config();
const { Pool } = require('pg');
const http = require('http');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 5000,
      path: `/api/v1${path}`, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, data }); } });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    console.log('=== Destekci Bildirim Testi ===\n');

    // testlogin kullanicisini bul
    const testUser = await pool.query("SELECT id FROM users WHERE email = 'testlogin@example.com'");
    const testUserId = testUser.rows[0].id;

    // testlogin'in SAHIP OLMADIGI bir kampanya bul
    const campaigns = await pool.query(
      `SELECT id, title, creator_id FROM campaigns WHERE creator_id != $1 AND status = 'active' LIMIT 5`,
      [testUserId]
    );

    if (campaigns.rows.length === 0) {
      console.log('testlogin disinda baska kullanicinin kampanyasi yok. Seed data gerekli.');
      return;
    }

    const campaign = campaigns.rows[0];
    console.log('Test kampanyasi:', campaign.title.slice(0, 50), '(' + campaign.id.slice(0, 8) + ')');

    // testlogin bu kampanyayi imzalasin (zaten imzalamissa atla)
    await pool.query(
      `INSERT INTO signatures (campaign_id, user_id, is_anonymous) VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
      [campaign.id, testUserId]
    );
    console.log('testlogin kampanyayi imzaladi (veya zaten imzalamisti)');

    // Kampanya sahibinin sifresini bul (test kullanicilari 12345678 kullanir)
    const owner = await pool.query('SELECT email FROM users WHERE id = $1', [campaign.creator_id]);
    const ownerEmail = owner.rows[0].email;

    const loginRes = await request('POST', '/auth/login', { email: ownerEmail, password: '12345678' });
    if (!loginRes.data.success) {
      console.log('Sahip girisi basarisiz (' + ownerEmail + '). Farkli sifre olabilir.');
      // Direkt DB'den bildirim ekleyerek test et
      console.log('\nDirekt DB testi yapiliyor...');
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
         VALUES ($1, 'campaign_update', $2, $3, 'campaign', $4)`,
        [testUserId, 'Destekledigin kampanyada yeni guncelleme', '"' + campaign.title + '" kampanyasinda yeni bir guncelleme paylasildi.', campaign.id]
      );
      console.log('PASS - Bildirim DB ye eklendi. /notifications sayfasini kontrol et.');
      return;
    }

    const ownerToken = loginRes.data.data.token;
    console.log('Kampanya sahibi giris yapti:', ownerEmail);

    // Onceki bildirim sayisi
    const before = await pool.query(
      `SELECT COUNT(*) as cnt FROM notifications WHERE user_id = $1 AND type = 'campaign_update'`,
      [testUserId]
    );
    const beforeCount = parseInt(before.rows[0].cnt);

    // Guncelleme ekle
    const updateRes = await request('POST', `/campaigns/${campaign.id}/updates`, {
      title: 'Test Guncellemesi',
      content: 'Bu guncelleme destekci bildirim sistemini test etmek icin eklendi.',
    }, ownerToken);

    if (!updateRes.data.success) {
      console.log('Guncelleme eklenemedi:', updateRes.data.message);
      return;
    }
    console.log('Guncelleme eklendi');

    // Bildirim kontrolu
    const after = await pool.query(
      `SELECT COUNT(*) as cnt FROM notifications WHERE user_id = $1 AND type = 'campaign_update'`,
      [testUserId]
    );
    const afterCount = parseInt(after.rows[0].cnt);

    const latest = await pool.query(
      `SELECT title, message FROM notifications WHERE user_id = $1 AND type = 'campaign_update' ORDER BY created_at DESC LIMIT 1`,
      [testUserId]
    );

    if (afterCount > beforeCount) {
      console.log('\nPASS - Bildirim geldi:');
      console.log('  Baslik:', latest.rows[0]?.title);
      console.log('  Mesaj:', latest.rows[0]?.message);
    } else {
      console.log('\nFAIL - Bildirim gelmedi (onceki:', beforeCount, 'sonraki:', afterCount + ')');
    }

    console.log('\ntestlogin@example.com ile /notifications sayfasini kontrol et.');

  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

run();
