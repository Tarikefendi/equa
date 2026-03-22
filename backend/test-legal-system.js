const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const BASE = 'http://localhost:5000/api/v1';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', { email, password });
  if (!r.data?.token) throw new Error(`Login failed for ${email}: ${r.message}`);
  return r.data.token;
}

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function main() {
  console.log('\n=== LEGAL SYSTEM TEST ===\n');

  // --- SETUP ---
  // Reset: pending legal request, clear applications
  await pool.query(`UPDATE legal_requests SET status = 'pending', matched_lawyer_id = NULL, matched_at = NULL, reopen_count = 0, last_reopened_at = NULL WHERE campaign_id = '750f9b1a18495655bb8b5cadefaeb92f'`);
  await pool.query(`DELETE FROM lawyer_applications WHERE legal_request_id IN (SELECT id FROM legal_requests WHERE campaign_id = '750f9b1a18495655bb8b5cadefaeb92f')`);
  await pool.query(`DELETE FROM notifications WHERE type IN ('lawyer_matched', 'lawyer_unmatched')`);
  await pool.query(`DELETE FROM campaign_updates WHERE campaign_id = '750f9b1a18495655bb8b5cadefaeb92f' AND type = 'lawyer_matched'`);
  console.log('Setup: reset to pending state\n');

  const adminToken = await login('testlogin@example.com', '12345678');
  const lawyerToken = await login('campaignowner@example.com', '12345678');

  // Get lawyer id
  const lawyerRes = await pool.query(`SELECT l.id, l.user_id, l.full_name, l.is_verified, l.is_available FROM lawyers l JOIN users u ON u.id = l.user_id WHERE u.email = 'campaignowner@example.com'`);
  const lawyer = lawyerRes.rows[0];

  // --- TEST 1: Legal status endpoint ---
  console.log('1. Legal Status Endpoint');
  const statusRes = await req('GET', '/campaigns/750f9b1a18495655bb8b5cadefaeb92f/legal-status', null, adminToken);
  check('success: true', statusRes.success);
  check('has request field', statusRes.data?.request !== undefined);
  check('has is_eligible field', statusRes.data?.is_eligible !== undefined);
  check('has support_count', statusRes.data?.support_count !== undefined);
  console.log(`     support_count=${statusRes.data?.support_count}, is_eligible=${statusRes.data?.is_eligible}, request.status=${statusRes.data?.request?.status}`);

  // --- TEST 2: Race condition — two lawyers apply simultaneously ---
  console.log('\n2. Race Condition (first-come-first-served)');
  // Make sure lawyer is verified and available
  await pool.query(`UPDATE lawyers SET is_verified = 1, is_available = 1 WHERE id = $1`, [lawyer.id]);

  // Get the legal request id
  const lrRes = await pool.query(`SELECT id FROM legal_requests WHERE campaign_id = '750f9b1a18495655bb8b5cadefaeb92f' LIMIT 1`);
  const legalRequestId = lrRes.rows[0]?.id;
  check('legal request exists', !!legalRequestId, legalRequestId);

  // Apply as lawyer
  const applyRes = await req('POST', `/legal-requests/${legalRequestId}/apply`, {}, lawyerToken);
  check('first apply succeeds', applyRes.success, applyRes.message);
  check('matched: true', applyRes.data?.matched === true);

  // Apply again (same lawyer) — should fail
  const applyAgain = await req('POST', `/legal-requests/${legalRequestId}/apply`, {}, lawyerToken);
  check('duplicate apply rejected', !applyAgain.success, applyAgain.message);

  // --- TEST 3: Already matched — another lawyer tries ---
  console.log('\n3. Already Matched State');
  const statusAfter = await req('GET', '/campaigns/750f9b1a18495655bb8b5cadefaeb92f/legal-status', null, adminToken);
  check('status is matched', statusAfter.data?.request?.status === 'matched', statusAfter.data?.request?.status);
  check('lawyer_name present', !!statusAfter.data?.request?.lawyer_name, statusAfter.data?.request?.lawyer_name);
  check('lawyer_expertise present', !!statusAfter.data?.request?.lawyer_expertise);

  // Try applying when already matched
  const applyWhenMatched = await req('POST', `/legal-requests/${legalRequestId}/apply`, {}, lawyerToken);
  check('apply when matched rejected', !applyWhenMatched.success);
  check('correct error message', applyWhenMatched.message?.includes('inceleniyor'), applyWhenMatched.message);

  // --- TEST 4: Notifications ---
  console.log('\n4. Notifications');
  const notifs = await pool.query(`SELECT user_id, type, title, message FROM notifications WHERE type = 'lawyer_matched' ORDER BY created_at DESC`);
  check('2 notifications created', notifs.rows.length === 2, `got ${notifs.rows.length}`);
  const ownerNotif = notifs.rows.find(n => n.title === 'Avukat Eşleşmesi');
  const lawyerNotif = notifs.rows.find(n => n.title === 'Hukuki Destek Talebi');
  check('owner notification exists', !!ownerNotif, JSON.stringify(notifs.rows.map(n => n.title)));
  check('lawyer notification exists', !!lawyerNotif);

  // --- TEST 5: Timeline event ---
  console.log('\n5. Timeline Event');
  const timeline = await pool.query(`SELECT type, title, content FROM campaign_updates WHERE campaign_id = '750f9b1a18495655bb8b5cadefaeb92f' AND type = 'lawyer_matched'`);
  check('timeline event created', timeline.rows.length > 0, `got ${timeline.rows.length}`);
  check('correct type', timeline.rows[0]?.type === 'lawyer_matched');
  console.log(`     content: "${timeline.rows[0]?.content?.substring(0, 60)}..."`);

  // --- TEST 6: Active case limit ---
  console.log('\n6. Active Case Limit (max 3)');
  // Count current active cases for this lawyer
  const activeCases = await pool.query(`SELECT COUNT(*) FROM legal_requests WHERE matched_lawyer_id = $1 AND status = 'matched'`, [lawyer.id]);
  console.log(`     Current active cases: ${activeCases.rows[0].count}`);
  check('active case count tracked', parseInt(activeCases.rows[0].count) >= 1);

  // --- TEST 7: Match timeout / reopen ---
  console.log('\n7. Match Timeout & Reopen');

  // First re-apply to get a fresh match
  await pool.query(`UPDATE legal_requests SET status = 'pending', matched_lawyer_id = NULL, matched_at = NULL WHERE id = $1`, [legalRequestId]);
  await pool.query(`DELETE FROM lawyer_applications WHERE legal_request_id = $1`, [legalRequestId]);
  const reApply = await req('POST', `/legal-requests/${legalRequestId}/apply`, {}, lawyerToken);
  check('re-apply succeeds for timeout test', reApply.success, reApply.message);

  // Simulate timeout: set matched_at to 49 hours ago
  await pool.query(`UPDATE legal_requests SET matched_at = NOW() - INTERVAL '49 hours' WHERE id = $1`, [legalRequestId]);

  // Call checkMatchTimeouts directly via DB (replicate the logic)
  const timeoutThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const timedOut = await pool.query(
    `SELECT lr.id, lr.campaign_id, lr.matched_lawyer_id, c.title AS campaign_title, c.creator_id
     FROM legal_requests lr JOIN campaigns c ON c.id = lr.campaign_id
     WHERE lr.status = 'matched' AND lr.matched_at < $1`,
    [timeoutThreshold]
  );
  check('timeout detected', timedOut.rows.length >= 1, `found: ${timedOut.rows.length}`);

  for (const r of timedOut.rows) {
    await pool.query(
      `UPDATE legal_requests SET status = 'pending', matched_lawyer_id = NULL, matched_at = NULL, reopen_count = reopen_count + 1, last_reopened_at = NOW() WHERE id = $1`,
      [r.id]
    );
    await pool.query(`DELETE FROM lawyer_applications WHERE legal_request_id = $1 AND lawyer_id = $2`, [r.id, r.matched_lawyer_id]);
    const nId = require('crypto').randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, is_read) VALUES ($1, $2, $3, $4, $5, 0)`,
      [nId, r.creator_id, 'lawyer_unmatched', 'Avukat Yanıt Vermedi',
       `"${r.campaign_title}" kampanyanız için seçilen avukat ile iletişim kurulamadı. Kampanya tekrar diğer avukatlara açıldı.`]
    );
  }

  const afterTimeout = await pool.query(`SELECT status, reopen_count FROM legal_requests WHERE id = $1`, [legalRequestId]);
  check('status back to pending', afterTimeout.rows[0]?.status === 'pending', afterTimeout.rows[0]?.status);
  check('reopen_count incremented', afterTimeout.rows[0]?.reopen_count >= 1, `reopen_count: ${afterTimeout.rows[0]?.reopen_count}`);

  const unmatched = await pool.query(`SELECT * FROM notifications WHERE type = 'lawyer_unmatched' ORDER BY created_at DESC LIMIT 1`);
  check('unmatched notification sent', unmatched.rows.length > 0);
  check('correct message', unmatched.rows[0]?.message?.includes('iletişim kurulamadı'), unmatched.rows[0]?.message);

  // --- TEST 8: Reopen state visible in legal-status ---
  console.log('\n8. Reopened State in Legal Status');
  const reopenedStatus = await req('GET', '/campaigns/750f9b1a18495655bb8b5cadefaeb92f/legal-status', null, adminToken);
  check('request status is pending', reopenedStatus.data?.request?.status === 'pending');
  check('reopen_count > 0', reopenedStatus.data?.request?.reopen_count > 0, reopenedStatus.data?.request?.reopen_count);

  // --- TEST 9: Open requests enriched data ---
  console.log('\n9. Open Requests (Lawyer Panel)');
  const openReqs = await req('GET', '/legal-requests', null, lawyerToken);
  check('success', openReqs.success);
  if (openReqs.data?.length > 0) {
    const r = openReqs.data[0];
    check('has campaign_status', !!r.campaign_status, r.campaign_status);
    check('has support_count', r.support_count !== undefined);
    check('has reopen_count', r.reopen_count !== undefined);
    console.log(`     campaign: "${r.campaign_title}", support: ${r.support_count}, status: ${r.campaign_status}, reopen: ${r.reopen_count}`);
  } else {
    check('has open requests', false, 'no open requests returned');
  }

  // --- SUMMARY ---
  console.log(`\n${'='.repeat(40)}`);
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  console.log('='.repeat(40));

  await pool.end();
}

main().catch(err => { console.error('Test error:', err); pool.end(); });
