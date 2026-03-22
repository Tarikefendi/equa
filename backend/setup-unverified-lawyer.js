const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const BASE = 'http://localhost:5000/api/v1';

async function main() {
  const email = 'newlawyer@example.com';
  const password = '12345678';
  const username = 'yeninavukat';

  // Varsa temizle
  await pool.query(`DELETE FROM lawyers WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [email]);
  await pool.query(`DELETE FROM users WHERE email = $1`, [email]);

  // Kullanıcı oluştur
  const userId = crypto.randomBytes(16).toString('hex');
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (id, email, username, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, 'user', 1)`,
    [userId, email, username, hash]
  );
  await pool.query(`INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [userId]);
  console.log(`✓ Kullanıcı oluşturuldu: ${email} / ${password}`);

  // Login ol
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) throw new Error('Login failed: ' + loginData.message);
  console.log('✓ Giriş yapıldı');

  // Avukat kaydı — form doldurma simülasyonu
  const registerRes = await fetch(`${BASE}/lawyers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      full_name: 'Mehmet Demir',
      expertise: 'İş Hukuku',
      bar_number: 'IST-2019-4821',
      city: 'İstanbul',
      bio: '10 yıllık iş hukuku deneyimi. Çalışan hakları ve işe iade davalarında uzman.'
    })
  });
  const registerData = await registerRes.json();
  if (!registerData.success) throw new Error('Lawyer register failed: ' + registerData.message);
  console.log('✓ Avukat kaydı yapıldı (onay bekliyor)');

  // Doğrulama durumunu kontrol et
  const lawyer = await pool.query(`SELECT id, full_name, is_verified FROM lawyers WHERE user_id = $1`, [userId]);
  console.log(`  is_verified: ${lawyer.rows[0].is_verified} (0 = onay bekliyor)`);

  console.log('\n=== TEST HAZIR ===');
  console.log('Yeni avukat : newlawyer@example.com / 12345678');
  console.log('Admin       : testlogin@example.com / 12345678');
  console.log('\nAdım 1: testlogin@example.com ile giriş yap → /admin → Avukatlar tab\'ı → "Mehmet Demir" görünmeli');
  console.log('Adım 2: Onayla butonuna tıkla');
  console.log('Adım 3: newlawyer@example.com ile giriş yap → /lawyers → artık başvurabilmeli');

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
