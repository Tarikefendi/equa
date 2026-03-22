const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function main() {
  // Avukat user bilgilerini al
  const lawyerRes = await pool.query(
    "SELECT l.id as lawyer_id, l.user_id, l.full_name, u.email FROM lawyers l JOIN users u ON u.id = l.user_id WHERE l.id = '77d34db3-ce9e-4796-a1e5-5a5697a79ed9'"
  );
  const lawyer = lawyerRes.rows[0];
  console.log('Lawyer:', lawyer);

  // Kampanya sahibini al
  const campRes = await pool.query(
    "SELECT c.creator_id, u.email as owner_email FROM campaigns c JOIN users u ON u.id = c.creator_id WHERE c.id = '750f9b1a18495655bb8b5cadefaeb92f'"
  );
  console.log('Campaign owner:', campRes.rows[0]);

  // HTTP ile apply endpoint'ini çağır
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: lawyer.email, password: '12345678' })
  });
  const loginData = await loginRes.json();
  if (!loginData.data?.token) {
    console.error('Login failed:', loginData);
    await pool.end();
    return;
  }
  const token = loginData.data.token;
  console.log('Logged in as lawyer');

  // Apply to legal request
  const applyRes = await fetch('http://localhost:5000/api/v1/legal-requests/0c0d2529e02a26ef83557c8e0d0cd776/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  const applyData = await applyRes.json();
  console.log('Apply response:', JSON.stringify(applyData, null, 2));

  // Bildirimleri kontrol et
  const notifs = await pool.query(
    "SELECT id, user_id, type, title, message FROM notifications WHERE type = 'lawyer_matched' ORDER BY created_at DESC"
  );
  console.log('\nlawyer_matched notifications after apply:', notifs.rows.length);
  notifs.rows.forEach(n => console.log(' -', n.user_id, '|', n.title, '|', n.message));

  await pool.end();
}
main().catch(console.error);
