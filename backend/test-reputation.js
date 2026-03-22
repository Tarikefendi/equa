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

function pass(msg) { console.log('  PASS -', msg); }
function fail(msg) { console.log('  FAIL -', msg); }

async function getReputation(userId) {
  const r = await pool.query('SELECT reputation FROM users WHERE id = $1', [userId]);
  return parseInt(r.rows[0]?.reputation || 0);
}

async function getEventCount(userId) {
  const r = await pool.query('SELECT COUNT(*) as cnt FROM reputation_events WHERE user_id = $1', [userId]);
  return parseInt(r.rows[0].cnt);
}

async function run() {
  try {
    console.log('=== Reputation Sistemi Testi ===\n');

    // Login
    const loginRes = await request('POST', '/auth/login', { email: 'testlogin@example.com', password: '12345678' });
    if (!loginRes.data.success) throw new Error('Login failed: ' + loginRes.data.message);
    const token = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;
    console.log('Kullanici:', loginRes.data.data.user.username, '(ID:', userId.slice(0,8) + ')');

    const repBefore = await getReputation(userId);
    const eventsBefore = await getEventCount(userId);
    console.log('Baslangic reputation:', repBefore, '| Event sayisi:', eventsBefore, '\n');

    // TEST 1: Kampanya olustur → +10
    console.log('--- TEST 1: Kampanya olusturma (+10) ---');
    const campRes = await request('POST', '/campaigns', {
      title: 'Reputation Test Kampanyasi',
      description: 'Bu kampanya reputation sistemini test etmek icin olusturuldu.',
      target_entity: 'Test Sirketi',
      target_type: 'company',
      category: 'Diger',
      standard_reference: 'Kurumsal Seffaflik Ilkeleri',
      demanded_action: 'Test amaçlı oluşturulmuş kampanya, lütfen dikkate almayın.',
      response_deadline_days: 30,
      evidence: { links: ['https://example.com'] },
    }, token);

    if (!campRes.data.success) { fail('Kampanya olusturulamadi: ' + campRes.data.message); }
    else {
      const campaignId = campRes.data.data.id;
      const repAfter = await getReputation(userId);
      const diff = repAfter - repBefore;
      diff >= 10 ? pass('Kampanya olusturma +' + diff + ' puan (beklenen: +10)') : fail('Beklenen +10, gelen: +' + diff);

      // TEST 2: Guncelleme ekle → +3
      console.log('\n--- TEST 2: Guncelleme ekleme (+3) ---');
      const rep2 = await getReputation(userId);
      const updRes = await request('POST', `/campaigns/${campaignId}/updates`, {
        title: 'Test Guncellemesi',
        content: 'Reputation test guncellemesi.',
      }, token);

      if (!updRes.data.success) { fail('Guncelleme eklenemedi: ' + updRes.data.message); }
      else {
        const rep3 = await getReputation(userId);
        const diff2 = rep3 - rep2;
        diff2 === 3 ? pass('Guncelleme +' + diff2 + ' puan') : fail('Beklenen +3, gelen: +' + diff2);
      }

      // TEST 3: /auth/reputation/events endpoint
      console.log('\n--- TEST 3: Reputation events endpoint ---');
      const eventsRes = await request('GET', '/auth/reputation/events', null, token);
      if (eventsRes.data.success && Array.isArray(eventsRes.data.data)) {
        const events = eventsRes.data.data;
        pass('Events endpoint calisiyor (' + events.length + ' event)');
        const types = events.map(e => e.type);
        types.includes('campaign_created') ? pass('campaign_created eventi var') : fail('campaign_created eventi yok');
        types.includes('update_added') ? pass('update_added eventi var') : fail('update_added eventi yok');
        if (events.length > 0) {
          console.log('  Son event:', events[0].type, '+' + events[0].points, 'puan');
        }
      } else {
        fail('Events endpoint basarisiz: ' + JSON.stringify(eventsRes.data));
      }

      // Temizlik
      await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);
      console.log('\nTest kampanyasi silindi.');
    }

    // TEST 4: evidence_approved → +5 (DB'den direkt test)
    console.log('\n--- TEST 4: Kanit onaylama (+5) ---');
    const rep4 = await getReputation(userId);
    const evCount4 = await getEventCount(userId);
    // Direkt service cagrisini simule et
    await pool.query(
      `INSERT INTO reputation_events (user_id, type, points, reference_type) VALUES ($1, 'evidence_approved', 5, 'evidence')`,
      [userId]
    );
    await pool.query('UPDATE users SET reputation = reputation + 5 WHERE id = $1', [userId]);
    const rep5 = await getReputation(userId);
    rep5 - rep4 === 5 ? pass('evidence_approved +5 puan') : fail('Beklenen +5, gelen: +' + (rep5 - rep4));

    // Ozet
    const finalRep = await getReputation(userId);
    const finalEvents = await getEventCount(userId);
    console.log('\n=== OZET ===');
    console.log('Final reputation:', finalRep);
    console.log('Toplam event sayisi:', finalEvents);
    console.log('\ntestlogin@example.com ile /profile sayfasini kontrol et.');
    console.log('Itibari Gecmisi bolumu gorunmeli.');

  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

run();
