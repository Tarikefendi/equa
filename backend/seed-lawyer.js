const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Kullanıcıyı bul
  const userRes = await pool.query("SELECT id, username FROM users WHERE username = 'kampanya_sahibi'");
  if (userRes.rows.length === 0) {
    console.log('Kullanıcı bulunamadı: kampanya_sahibi');
    pool.end(); return;
  }
  const user = userRes.rows[0];
  console.log('Kullanıcı bulundu:', user);

  // Lawyers tablosunun kolonlarını kontrol et
  const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'lawyers'");
  console.log('Lawyers kolonları:', colRes.rows.map(r => r.column_name));

  // Zaten kayıt var mı?
  const existing = await pool.query("SELECT * FROM lawyers WHERE user_id = $1", [user.id]);
  if (existing.rows.length > 0) {
    console.log('Zaten kayıt var:', existing.rows[0]);
    pool.end(); return;
  }

  // Avukat kaydı ekle
  const insert = await pool.query(
    `INSERT INTO lawyers (user_id, full_name, specializations, bar_number, city, bio, is_verified, is_available)
     VALUES ($1, $2, $3, $4, $5, $6, 1, 1) RETURNING *`,
    [user.id, 'Kampanya Sahibi', 'Tüketici Hukuku, İş Hukuku', 'IST-12345', 'İstanbul', 'Deneyimli hukuk profesyoneli.']
  );
  console.log('Avukat kaydı oluşturuldu:', insert.rows[0]);
  pool.end();
}

run().catch(e => { console.error(e); pool.end(); });
