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
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    console.log('=== Gorunurluk Sistemi Testi ===\n');

    const loginRes = await request('POST', '/auth/login', { email: 'testlogin@example.com', password: '12345678' });
    if (!loginRes.data.success) throw new Error('Login failed: ' + loginRes.data.message);
    const token = loginRes.data.data.token;
    console.log('Giris basarili\n');

    const base = {
      description: 'Gorunurluk test kampanyasi.',
      target_entity: 'Test Sirketi',
      target_type: 'company',
      category: 'Diger',
      standard_reference: 'Kurumsal Seffaflik Ilkeleri',
      demanded_action: 'Test amacli olusturulmus kampanya, lutfen dikkate almayin.',
      response_deadline_days: 30,
      evidence: { links: ['https://example.com'] },
    };

    const pubRes = await request('POST', '/campaigns', { ...base, title: 'VisTest public', visibility: 'public' }, token);
    const unlRes = await request('POST', '/campaigns', { ...base, title: 'VisTest unlisted', visibility: 'unlisted' }, token);
    const prvRes = await request('POST', '/campaigns', { ...base, title: 'VisTest private', visibility: 'private' }, token);

    if (!pubRes.data.success) throw new Error('Public: ' + pubRes.data.message);
    if (!unlRes.data.success) throw new Error('Unlisted: ' + unlRes.data.message);
    if (!prvRes.data.success) throw new Error('Private: ' + prvRes.data.message);

    const pubId = pubRes.data.data.id;
    const unlId = unlRes.data.data.id;
    const prvId = prvRes.data.data.id;
    console.log('3 kampanya olusturuldu: public=' + pubId.slice(0,8) + ' unlisted=' + unlId.slice(0,8) + ' private=' + prvId.slice(0,8) + '\n');

    // TEST 1: Liste
    const listRes = await request('GET', '/campaigns?limit=200');
    const list = listRes.data.data || [];
    const inList = (id) => list.some((c) => c.id === id);
    console.log('--- TEST 1: Kampanya listesi ---');
    console.log('  public   listede: ' + (inList(pubId) ? 'PASS' : 'FAIL'));
    console.log('  unlisted listede: ' + (!inList(unlId) ? 'PASS (gizli)' : 'FAIL (gorunuyor!)'));
    console.log('  private  listede: ' + (!inList(prvId) ? 'PASS (gizli)' : 'FAIL (gorunuyor!)'));

    // TEST 2: Direct URL (anonim)
    const pubA = await request('GET', '/campaigns/' + pubId);
    const unlA = await request('GET', '/campaigns/' + unlId);
    const prvA = await request('GET', '/campaigns/' + prvId);
    console.log('\n--- TEST 2: Direct URL (anonim) ---');
    console.log('  public   HTTP ' + pubA.status + ': ' + (pubA.status === 200 ? 'PASS' : 'FAIL'));
    console.log('  unlisted HTTP ' + unlA.status + ': ' + (unlA.status === 200 ? 'PASS' : 'FAIL'));
    console.log('  private  HTTP ' + prvA.status + ': ' + (prvA.status === 404 ? 'PASS (engellendi)' : 'FAIL (erisilebildi!)'));

    // TEST 3: Sahip erisimi
    const prvOwner = await request('GET', '/campaigns/' + prvId, null, token);
    console.log('\n--- TEST 3: Sahip private erisimi ---');
    console.log('  private (sahip) HTTP ' + prvOwner.status + ': ' + (prvOwner.status === 200 ? 'PASS' : 'FAIL'));

    // TEST 4: Arama
    const searchRes = await request('GET', '/campaigns/search?q=VisTest');
    const sr = searchRes.data.data || [];
    const inSearch = (id) => sr.some((c) => c.id === id);
    console.log('\n--- TEST 4: Arama sonuclari ---');
    console.log('  public   aramada: ' + (inSearch(pubId) ? 'PASS' : 'FAIL'));
    console.log('  unlisted aramada: ' + (!inSearch(unlId) ? 'PASS (gizli)' : 'FAIL'));
    console.log('  private  aramada: ' + (!inSearch(prvId) ? 'PASS (gizli)' : 'FAIL'));

    await pool.query('DELETE FROM campaigns WHERE id IN ($1,$2,$3)', [pubId, unlId, prvId]);
    console.log('\nTest kampanyalari silindi.');
    console.log('=== TAMAMLANDI ===');
  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

run();
