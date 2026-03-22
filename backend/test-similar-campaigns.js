const API = 'http://localhost:5000/api/v1';

async function req(path) {
  const res = await fetch(`${API}${path}`);
  return { status: res.status, data: await res.json() };
}

async function run() {
  console.log('=== Duplicate Campaign Detection Testi ===\n');

  // 1. 3 karakterden az — boş dönmeli
  const r1 = await req('/campaigns/similar?query=Te');
  console.log(`${r1.status === 200 && r1.data.data.length === 0 ? '✅' : '❌'} 1. 2 karakter → boş sonuç (${r1.data.data.length} sonuç)`);

  // 2. "Test" ile arama — sonuç gelmeli
  const r2 = await req('/campaigns/similar?query=Test');
  console.log(`${r2.status === 200 ? '✅' : '❌'} 2. "Test" araması → ${r2.data.data.length} sonuç`);
  if (r2.data.data.length > 0) {
    r2.data.data.forEach(c => console.log(`   - ${c.title} | ${c.support_count} destek | ${c.entity_name || 'entity yok'}`));
  }

  // 3. Max 5 sonuç kontrolü
  const r3 = await req('/campaigns/similar?query=a');
  console.log(`${r3.status === 200 && r3.data.data.length <= 5 ? '✅' : '❌'} 3. Max 5 sonuç limiti (${r3.data.data.length} sonuç)`);

  // 4. support_count'a göre sıralama
  const r4 = await req('/campaigns/similar?query=Kampanya');
  if (r4.data.data.length >= 2) {
    const sorted = r4.data.data.every((c, i, arr) => i === 0 || arr[i-1].support_count >= c.support_count);
    console.log(`${sorted ? '✅' : '❌'} 4. support_count DESC sıralama`);
  } else {
    console.log(`⏭️  4. Sıralama testi için yeterli sonuç yok`);
  }

  // 5. Var olmayan başlık
  const r5 = await req('/campaigns/similar?query=xyzxyzxyz123');
  console.log(`${r5.status === 200 && r5.data.data.length === 0 ? '✅' : '❌'} 5. Eşleşmeyen sorgu → boş sonuç`);

  console.log('\n=== Test tamamlandı ===');
}

run().catch(console.error);
