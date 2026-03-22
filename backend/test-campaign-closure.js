const BASE = 'http://localhost:5000/api/v1';

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('=== Campaign Closure System Test ===\n');

  // 1. Login
  const login = await req('POST', '/auth/login', { email: 'testlogin@example.com', password: '12345678' });
  const token = login.data?.data?.token;
  if (!token) { console.error('❌ Login failed:', login.data); process.exit(1); }
  console.log('✅ Login OK');

  // 2. Get an active campaign
  const campaigns = await req('GET', '/campaigns?status=active&limit=2', null, token);
  const list = campaigns.data?.data;
  const campaign = Array.isArray(list) ? list[0] : list?.campaigns?.[0];
  if (!campaign) { console.error('❌ No active campaign found', JSON.stringify(campaigns.data)); process.exit(1); }
  console.log(`✅ Found active campaign: ${campaign.id} — "${campaign.title}"`);

  // 3. Test resolve (owner/admin)
  const resolve = await req('POST', `/campaigns/${campaign.id}/resolve`, { reason: 'Test: sorun çözüldü' }, token);
  if (resolve.status === 200) {
    console.log('✅ Resolve OK:', resolve.data?.data?.message);
  } else {
    console.log('⚠️  Resolve response:', resolve.status, resolve.data?.message);
  }

  // 4. Get another active campaign for close test
  const campaigns2 = await req('GET', '/campaigns?status=active&limit=1', null, token);
  const list2 = campaigns2.data?.data;
  const campaign2 = Array.isArray(list2) ? list2[0] : list2?.campaigns?.[0];
  if (!campaign2) {
    console.log('⚠️  No more active campaigns for close test — skipping');
  } else {
    const close = await req('POST', `/campaigns/${campaign2.id}/close`, {}, token);
    if (close.status === 200) {
      console.log('✅ Close OK:', close.data?.data?.message);
    } else {
      console.log('⚠️  Close response:', close.status, close.data?.message);
    }
  }

  // 5. Verify status history updated
  const history = await req('GET', `/campaigns/${campaign.id}/status-history`, null, token);
  const histList = history.data?.data;
  const lastEntry = Array.isArray(histList) ? histList.slice(-1)[0] : null;
  console.log(`✅ Status history last entry: ${lastEntry?.old_status} → ${lastEntry?.new_status} (${lastEntry?.reason})`);

  console.log('\n=== All tests done ===');
}

run().catch(console.error);
