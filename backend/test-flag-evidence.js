const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Son eklenen approved kanıtı bul
  const ev = await pool.query(`
    SELECT ce.id, ce.title, ce.status, ce.flag_count, c.title as campaign_title
    FROM campaign_evidence ce
    JOIN campaigns c ON c.id = ce.campaign_id
    WHERE ce.status = 'approved'
    ORDER BY ce.created_at DESC
    LIMIT 1
  `);

  if (!ev.rows[0]) { console.log('Approved kanıt bulunamadı'); pool.end(); return; }
  const evidence = ev.rows[0];
  console.log('Test edilecek kanıt:', evidence);

  // 3 farklı test kullanıcısı bul (kanıt sahibi hariç)
  const users = await pool.query(`
    SELECT id, username FROM users
    WHERE id != (SELECT added_by FROM campaign_evidence WHERE id = $1)
    LIMIT 3
  `, [evidence.id]);

  if (users.rows.length < 3) { console.log('Yeterli kullanıcı yok:', users.rows.length); pool.end(); return; }
  console.log('Flag atacak kullanıcılar:', users.rows.map(u => u.username));

  // Mevcut flag'leri temizle (temiz test için)
  await pool.query('DELETE FROM evidence_flags WHERE evidence_id = $1', [evidence.id]);
  await pool.query('UPDATE campaign_evidence SET flag_count = 0, status = $1 WHERE id = $2', ['approved', evidence.id]);
  console.log('Mevcut flag\'ler temizlendi');

  // 3 kullanıcı sırayla flag atsın
  for (let i = 0; i < 3; i++) {
    const userId = users.rows[i].id;
    await pool.query('INSERT INTO evidence_flags (evidence_id, user_id) VALUES ($1, $2)', [evidence.id, userId]);
    const res = await pool.query(
      'UPDATE campaign_evidence SET flag_count = flag_count + 1 WHERE id = $1 RETURNING flag_count',
      [evidence.id]
    );
    const flagCount = res.rows[0].flag_count;
    console.log(`  ${users.rows[i].username} flag attı → flag_count: ${flagCount}`);

    if (flagCount >= 3) {
      await pool.query(`UPDATE campaign_evidence SET status = 'flagged' WHERE id = $1 AND status = 'approved'`, [evidence.id]);
      console.log('  ✅ Otomatik flagged!');
    }
  }

  // Sonucu kontrol et
  const result = await pool.query('SELECT id, title, status, flag_count FROM campaign_evidence WHERE id = $1', [evidence.id]);
  console.log('\nSon durum:', result.rows[0]);
  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
