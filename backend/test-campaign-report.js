const API = 'http://localhost:5000/api/v1';

async function req(method, path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('=== Campaign Report Sistemi Testi ===\n');

  // 1. Admin login
  const login = await req('POST', '/auth/login', { email: 'testlogin@example.com', password: '12345678' });
  const token = login.data?.data?.token;
  if (!token) { console.error('❌ Login başarısız:', login.data); process.exit(1); }
  console.log('✅ 1. Admin login OK');

  // 2. Kampanya listesinden bir kampanya al
  const campaigns = await req('GET', '/campaigns');
  const campaign = campaigns.data?.data?.[0];
  if (!campaign) { console.error('❌ Kampanya bulunamadı'); process.exit(1); }
  console.log(`✅ 2. Test kampanyası: "${campaign.title}" (id: ${campaign.id})`);

  // 3. Şikayet gönder
  const report = await req('POST', `/campaigns/${campaign.id}/report`, {
    reason: 'false_information',
    description: 'Test şikayeti - otomatik test'
  }, token);
  console.log(`${report.status === 201 ? '✅' : '❌'} 3. Şikayet gönder → ${report.status}: ${report.data?.message || JSON.stringify(report.data?.data)}`);

  // 4. Aynı kampanyayı tekrar şikayet et (duplicate engeli)
  const report2 = await req('POST', `/campaigns/${campaign.id}/report`, {
    reason: 'spam'
  }, token);
  const blocked = report2.status === 400 && report2.data?.message?.includes('zaten');
  console.log(`${blocked ? '✅' : '❌'} 4. Duplicate engeli → ${report2.status}: ${report2.data?.message}`);

  // 5. Kullanıcının kendi raporunu getir
  const userReport = await req('GET', `/campaigns/${campaign.id}/report`, null, token);
  const hasReport = userReport.data?.data?.id != null;
  console.log(`${hasReport ? '✅' : '❌'} 5. Kullanıcı raporu getir → ${userReport.status}: id=${userReport.data?.data?.id}`);

  // 6. Giriş yapmadan şikayet (401 beklenir)
  const noAuth = await req('POST', `/campaigns/${campaign.id}/report`, { reason: 'spam' });
  console.log(`${noAuth.status === 401 ? '✅' : '❌'} 6. Auth olmadan şikayet → ${noAuth.status} (401 beklendi)`);

  // 7. Sebepsiz şikayet (400 beklenir)
  const noReason = await req('POST', `/campaigns/${campaign.id}/report`, {}, token);
  console.log(`${noReason.status === 400 ? '✅' : '❌'} 7. Sebepsiz şikayet → ${noReason.status} (400 beklendi)`);

  // 8. Admin: tüm raporları listele
  const allReports = await req('GET', '/admin/campaign-reports', null, token);
  const count = allReports.data?.data?.length ?? 0;
  console.log(`${allReports.status === 200 ? '✅' : '❌'} 8. Admin rapor listesi → ${allReports.status}: ${count} rapor`);

  // 9. Admin: rapor durumunu güncelle
  if (count > 0) {
    const reportId = allReports.data.data[0].id;
    const update = await req('PATCH', `/admin/campaign-reports/${reportId}`, { status: 'reviewed' }, token);
    console.log(`${update.status === 200 ? '✅' : '❌'} 9. Rapor durumu güncelle → ${update.status}: status=${update.data?.data?.status}`);
  } else {
    console.log('⚠️  9. Rapor yok, güncelleme testi atlandı');
  }

  // Temizlik: test raporunu sil (opsiyonel, DB'de kalabilir)
  console.log('\n=== Test tamamlandı ===');
}

run().catch(console.error);
