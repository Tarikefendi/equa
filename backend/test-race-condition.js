const BASE = 'http://localhost:5000/api/v1';
const LEGAL_REQUEST_ID = '551c019f6e34e05c8bac2ef81a21826d';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.data?.token) throw new Error(`Login failed: ${data.message}`);
  return data.data.token;
}

async function apply(token, label) {
  const res = await fetch(`${BASE}/legal-requests/${LEGAL_REQUEST_ID}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  return { label, success: data.success, message: data.message, data: data.data };
}

async function main() {
  console.log('=== RACE CONDITION TEST ===\n');

  const [token1, token2] = await Promise.all([
    login('campaignowner@example.com', '12345678'),
    login('lawyer2@example.com', '12345678'),
  ]);
  console.log('Her iki avukat giriş yaptı.\n');
  console.log('Aynı anda apply gönderiliyor...\n');

  // Fire both simultaneously
  const [res1, res2] = await Promise.all([
    apply(token1, 'Avukat1 (campaignowner)'),
    apply(token2, 'Avukat2 (lawyer2)'),
  ]);

  console.log(`${res1.label}: success=${res1.success} | ${res1.success ? 'MATCHED' : res1.message}`);
  console.log(`${res2.label}: success=${res2.success} | ${res2.success ? 'MATCHED' : res2.message}`);

  const winners = [res1, res2].filter(r => r.success);
  const losers  = [res1, res2].filter(r => !r.success);

  console.log('\n--- SONUÇ ---');
  if (winners.length === 1 && losers.length === 1) {
    console.log(`✓ Sadece 1 avukat eşleşti: ${winners[0].label}`);
    console.log(`✓ Diğeri reddedildi: "${losers[0].message}"`);
  } else if (winners.length === 2) {
    console.log('✗ HATA: İki avukat da eşleşti! Race condition koruması çalışmıyor.');
  } else {
    console.log('✗ İkisi de başarısız oldu — beklenmedik durum.');
    console.log(res1, res2);
  }
}

main().catch(console.error);
