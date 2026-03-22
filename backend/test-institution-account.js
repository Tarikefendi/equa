// Test: Verified Institution Account System
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const BASE = 'http://localhost:5000/api/v1';
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const ENTITY_ID = 'e37adf2a-6a6e-4ae6-be9a-91d52f0c31ec'; // Türk Telekom (verified)
const ACTIVE_CAMPAIGN_ID = '1de4ae1242d997bd4a050c895153e377'; // active kampanya
const INSTITUTION_EMAIL = 'turktelekom@test.com';
const INSTITUTION_PASS = 'Test1234!';
const INSTITUTION_USER = 'turktelekom_official';

let adminToken = '';
let institutionToken = '';
let regularToken = '';

async function cleanup() {
  await pool.query("DELETE FROM users WHERE email = $1", [INSTITUTION_EMAIL]);
  await pool.query("UPDATE campaigns SET status = 'active', status_changed_at = NULL WHERE id = $1", [ACTIVE_CAMPAIGN_ID]);
  await pool.query("DELETE FROM campaign_updates WHERE campaign_id = $1 AND type = 'official_response'", [ACTIVE_CAMPAIGN_ID]);
}

function pass(msg) { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.log(`  ✗ ${msg}`); }

async function run() {
  console.log('\n=== Institution Account System Test ===\n');

  await cleanup();

  // 1. Admin login
  console.log('1. Admin login');
  try {
    const r = await axios.post(`${BASE}/auth/login`, { email: 'testlogin@example.com', password: '12345678' });
    adminToken = r.data.data.token;
    const payload = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString());
    pass(`Admin login OK — role: ${payload.role}`);
  } catch (e) {
    fail(`Admin login failed: ${e.response?.data?.message || e.message}`);
    return;
  }

  // 2. Regular user token — use admin token but test with a non-institution role check
  // We'll test by calling the endpoint without a token first
  console.log('\n2. Unauthenticated request to official response (should be 401)');
  try {
    await axios.post(
      `${BASE}/campaigns/${ACTIVE_CAMPAIGN_ID}/updates/official-response`,
      { content: 'Test.' }
    );
    fail('Should have been rejected but was accepted');
  } catch (e) {
    if (e.response?.status === 401) pass(`Correctly rejected with 401`);
    else fail(`Wrong error: ${e.response?.status}`);
  }

  // 3. Admin (non-institution) tries official response (should be 403)
  console.log('\n3. Admin user (non-institution role) tries official response (should be 403)');
  try {
    await axios.post(
      `${BASE}/campaigns/${ACTIVE_CAMPAIGN_ID}/updates/official-response`,
      { content: 'Bu bir test yanıtıdır.' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    fail('Should have been rejected but was accepted');
  } catch (e) {
    if (e.response?.status === 403) pass(`Correctly rejected with 403: ${e.response.data.message}`);
    else fail(`Wrong error: ${e.response?.status} — ${e.response?.data?.message}`);
  }

  // 4. Admin creates institution account
  console.log('\n4. Admin creates institution account for Türk Telekom');
  try {
    const r = await axios.post(
      `${BASE}/admin/entities/${ENTITY_ID}/institution-account`,
      { email: INSTITUTION_EMAIL, password: INSTITUTION_PASS, username: INSTITUTION_USER },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    pass(`Institution account created: ${r.data.data.email} (${r.data.data.entity_name})`);
  } catch (e) {
    fail(`Create institution account failed: ${e.response?.data?.message || e.message}`);
    return;
  }

  // 5. Duplicate institution account (should fail)
  console.log('\n5. Duplicate institution account (should fail)');
  try {
    await axios.post(
      `${BASE}/admin/entities/${ENTITY_ID}/institution-account`,
      { email: 'duplicate@test.com', password: INSTITUTION_PASS, username: 'duplicate_user' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    fail('Should have been rejected but was accepted');
  } catch (e) {
    if (e.response?.status === 400) pass(`Correctly rejected: ${e.response.data.message}`);
    else fail(`Wrong error: ${e.response?.status}`);
  }

  // 6. Institution login
  console.log('\n6. Institution account login');
  try {
    const r = await axios.post(`${BASE}/auth/login`, { email: INSTITUTION_EMAIL, password: INSTITUTION_PASS });
    institutionToken = r.data.data.token;
    const payload = JSON.parse(Buffer.from(institutionToken.split('.')[1], 'base64').toString());
    pass(`Institution login OK — role: ${payload.role}, entity_id: ${payload.entity_id}`);
  } catch (e) {
    fail(`Institution login failed: ${e.response?.data?.message || e.message}`);
    return;
  }

  // 7. Check campaign status before response
  console.log('\n7. Campaign status before official response');
  try {
    const r = await axios.get(`${BASE}/campaigns/${ACTIVE_CAMPAIGN_ID}`);
    pass(`Campaign status: ${r.data.data.status}`);
  } catch (e) {
    fail(`Get campaign failed: ${e.message}`);
  }

  // 8. Institution posts official response
  console.log('\n8. Institution posts official response');
  try {
    const r = await axios.post(
      `${BASE}/campaigns/${ACTIVE_CAMPAIGN_ID}/updates/official-response`,
      {
        content: 'Müşterilerimizin endişelerini dikkate alıyoruz. Fatura sistemimizi gözden geçireceğiz.',
        title: 'Türk Telekom Resmi Açıklaması',
        source_url: 'https://turktelekom.com.tr/aciklama'
      },
      { headers: { Authorization: `Bearer ${institutionToken}` } }
    );
    pass(`Official response posted: type=${r.data.data.type}, entity_name=${r.data.data.entity_name}`);
  } catch (e) {
    fail(`Official response failed: ${e.response?.data?.message || e.message}`);
  }

  // 9. Check campaign status after response (should be response_received)
  console.log('\n9. Campaign status after official response (should be response_received)');
  try {
    const r = await axios.get(`${BASE}/campaigns/${ACTIVE_CAMPAIGN_ID}`);
    const status = r.data.data.status;
    if (status === 'response_received') pass(`Status correctly updated to: ${status}`);
    else fail(`Status is "${status}", expected "response_received"`);
  } catch (e) {
    fail(`Get campaign failed: ${e.message}`);
  }

  // 10. Check timeline shows official_response
  console.log('\n10. Timeline shows official_response entry');
  try {
    const r = await axios.get(`${BASE}/campaigns/${ACTIVE_CAMPAIGN_ID}/updates`);
    const officialResponse = r.data.data.find((u) => u.type === 'official_response');
    if (officialResponse) pass(`Timeline has official_response: "${officialResponse.title}" by ${officialResponse.entity_name}`);
    else fail('No official_response found in timeline');
  } catch (e) {
    fail(`Get updates failed: ${e.message}`);
  }

  // 11. Institution tries to respond to wrong campaign (no entity match)
  console.log('\n11. Institution tries wrong campaign (should fail)');
  try {
    const wrongCampaign = await pool.query(
      "SELECT id FROM campaigns WHERE entity_id != $1 AND status = 'active' LIMIT 1",
      [ENTITY_ID]
    );
    if (wrongCampaign.rows.length === 0) {
      pass('No other active campaign to test with (skip)');
    } else {
      await axios.post(
        `${BASE}/campaigns/${wrongCampaign.rows[0].id}/updates/official-response`,
        { content: 'Yetkisiz yanıt denemesi.' },
        { headers: { Authorization: `Bearer ${institutionToken}` } }
      );
      fail('Should have been rejected but was accepted');
    }
  } catch (e) {
    if (e.response?.status === 400 || e.response?.status === 403) pass(`Correctly rejected: ${e.response.data.message}`);
    else fail(`Unexpected error: ${e.response?.status} ${e.response?.data?.message}`);
  }

  console.log('\n=== Test complete ===\n');
  await pool.end();
}

run().catch(async (e) => {
  console.error('Fatal:', e.message);
  await pool.end();
});
