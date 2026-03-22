const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const BASE = 'http://localhost:5000/api/v1';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!data.data?.token) throw new Error(`Login failed: ${data.message}`);
  return data.data.token;
}

async function applyTo(requestId, token) {
  const res = await fetch(`${BASE}/legal-requests/${requestId}/apply`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

async function createCampaignWithRequest(ownerId, entityId, label) {
  const campId = crypto.randomBytes(16).toString('hex');
  await pool.query(
    `INSERT INTO campaigns (id, title, description, status, creator_id, entity_id, target_entity, target_type, category, response_deadline_days, response_deadline_date, created_at, last_activity_at)
     VALUES ($1, $2, $3, 'no_response', $4, $5, 'Test Kurumu', 'company', 'consumer_rights', 30, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days')`,
    [campId, label, 'Limit testi için oluşturuldu.', ownerId, entityId]
  );

  // 55 imza
  const users = await pool.query('SELECT id FROM users LIMIT 60');
  let inserted = 0;
  for (const u of users.rows) {
    if (inserted >= 55) break;
    try {
      await pool.query(
        `INSERT INTO signatures (id, campaign_id, user_id, is_anonymous, created_at) VALUES ($1, $2, $3, true, NOW())`,
        [crypto.randomBytes(16).toString('hex'), campId, u.id]
      );
      inserted++;
    } catch {}
  }

  // Legal request
  const lrId = crypto.randomBytes(16).toString('hex');
  await pool.query(`INSERT INTO legal_requests (id, campaign_id, requester_id, status) VALUES ($1, $2, $3, 'pending')`, [lrId, campId, ownerId]);

  return { campId, lrId };
}

async function main() {
  console.log('=== MAX ACTIVE CASES LİMİT TESTİ ===\n');

  // lawyer2 bilgilerini al
  const lawyerRes = await pool.query(`SELECT l.id, u.email FROM lawyers l JOIN users u ON u.id = l.user_id WHERE u.email = 'lawyer2@example.com'`);
  const lawyer = lawyerRes.rows[0];
  if (!lawyer) throw new Error('lawyer2@example.com bulunamadı');
  console.log(`Avukat: ${lawyer.email} (id: ${lawyer.id})`);

  // Mevcut aktif case'leri temizle
  await pool.query(`UPDATE legal_requests SET status = 'pending', matched_lawyer_id = NULL, matched_at = NULL WHERE matched_lawyer_id = $1`, [lawyer.id]);

  // Kampanya sahibi
  const ownerRes = await pool.query(`SELECT id FROM users WHERE email = 'campaignowner@example.com'`);
  const ownerId = ownerRes.rows[0].id;
  const entityRes = await pool.query(`SELECT id FROM entities LIMIT 1`);
  const entityId = entityRes.rows[0]?.id;

  const token = await login('lawyer2@example.com', '12345678');

  // 3 kampanya oluştur ve eşleştir
  const campaigns = [];
  for (let i = 1; i <= 4; i++) {
    const { campId, lrId } = await createCampaignWithRequest(ownerId, entityId, `Limit Test Kampanya ${i}`);
    campaigns.push({ i, campId, lrId });
    console.log(`Kampanya ${i} oluşturuldu: ${campId}`);
  }

  console.log('\nAvukat ilk 3 kampanyaya başvuruyor...\n');
  for (const c of campaigns.slice(0, 3)) {
    const res = await applyTo(c.lrId, token);
    console.log(`  Kampanya ${c.i}: success=${res.success} | ${res.success ? 'MATCHED' : res.message}`);
  }

  // Aktif case sayısını kontrol et
  const activeCount = await pool.query(`SELECT COUNT(*) FROM legal_requests WHERE matched_lawyer_id = $1 AND status = 'matched'`, [lawyer.id]);
  console.log(`\nAktif kampanya sayısı: ${activeCount.rows[0].count}/3`);

  // 4. kampanyaya başvur — limit aşılmalı
  console.log('\n4. kampanyaya başvuruluyor (limit aşımı bekleniyor)...');
  const res4 = await applyTo(campaigns[3].lrId, token);
  console.log(`  Kampanya 4: success=${res4.success} | ${res4.message}`);

  console.log('\n--- SONUÇ ---');
  if (!res4.success && res4.message?.includes('maksimum')) {
    console.log('✓ Limit koruması çalışıyor:', res4.message);
  } else {
    console.log('✗ Limit koruması çalışmıyor! 4. kampanya da eşleşti.');
  }

  console.log('\n4. kampanya URL (UI\'dan test için):');
  console.log(`  http://localhost:3000/campaigns/${campaigns[3].campId}`);
  console.log(`  Legal Request ID: ${campaigns[3].lrId}`);

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
