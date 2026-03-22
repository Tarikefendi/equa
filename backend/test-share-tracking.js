const API = 'http://localhost:5000/api/v1';

async function req(method, path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function run() {
  console.log('=== Campaign Share Tracking Testi ===\n');

  const login = await req('POST', '/auth/login', { email: 'testlogin@example.com', password: '12345678' });
  const token = login.data?.data?.token;
  const campaigns = await req('GET', '/campaigns');
  const id = campaigns.data?.data?.[0]?.id;
  if (!id) { console.error('❌ Kampanya bulunamadı'); process.exit(1); }
  console.log(`✅ Kampanya: ${id}`);

  // 1. WhatsApp paylaşımı (auth ile)
  const r1 = await req('POST', `/campaigns/${id}/share`, { platform: 'whatsapp' }, token);
  console.log(`${r1.status === 200 ? '✅' : '❌'} 1. WhatsApp share → share_count: ${r1.data?.data?.share_count}`);

  // 2. X paylaşımı (auth olmadan)
  const r2 = await req('POST', `/campaigns/${id}/share`, { platform: 'x' });
  console.log(`${r2.status === 200 ? '✅' : '❌'} 2. X share (anonim) → share_count: ${r2.data?.data?.share_count}`);

  // 3. Telegram
  const r3 = await req('POST', `/campaigns/${id}/share`, { platform: 'telegram' });
  console.log(`${r3.status === 200 ? '✅' : '❌'} 3. Telegram share → share_count: ${r3.data?.data?.share_count}`);

  // 4. copy_link
  const r4 = await req('POST', `/campaigns/${id}/share`, { platform: 'copy_link' });
  console.log(`${r4.status === 200 ? '✅' : '❌'} 4. Copy link share → share_count: ${r4.data?.data?.share_count}`);

  // 5. İstatistikler
  const r5 = await req('GET', `/campaigns/${id}/share-stats`);
  console.log(`${r5.status === 200 ? '✅' : '❌'} 5. Share stats → total: ${r5.data?.data?.total}`);
  console.log('   Platform dağılımı:', r5.data?.data?.by_platform);

  console.log('\n=== Test tamamlandı ===');
}

run().catch(console.error);
