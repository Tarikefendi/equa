const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
const { randomBytes } = require('crypto');

const CAMPAIGN_ID = '750f9b1a18495655bb8b5cadefaeb92f';

async function run() {
  // Mevcut imza sayısını kontrol et
  const current = await pool.query('SELECT COUNT(*) FROM signatures WHERE campaign_id = $1', [CAMPAIGN_ID]);
  console.log('Current signatures:', current.rows[0].count);

  // Gerçek bir user_id al
  const userRes = await pool.query('SELECT id FROM users LIMIT 1');
  const baseUserId = userRes.rows[0].id;

  // 55 sahte imza ekle — user_id'yi prefix ile türet (FK bypass için users tablosuna gerek yok, is_anonymous=true)
  // Bunun yerine aynı user_id'yi tekrar kullanmak yerine users tablosundan birden fazla al
  const usersRes = await pool.query('SELECT id FROM users');
  const userIds = usersRes.rows.map(r => r.id);

  let added = 0;
  for (let i = 0; i < 55; i++) {
    const id = randomBytes(16).toString('hex');
    const userId = userIds[i % userIds.length];
    try {
      await pool.query(
        `INSERT INTO signatures (id, campaign_id, user_id, is_anonymous, created_at)
         VALUES ($1, $2, $3, true, NOW() - ($4 || ' minutes')::interval)
         ON CONFLICT DO NOTHING`,
        [id, CAMPAIGN_ID, userId, i]
      );
      added++;
    } catch (e) {
      // skip duplicate user
    }
  }

  const after = await pool.query('SELECT COUNT(*) FROM signatures WHERE campaign_id = $1', [CAMPAIGN_ID]);
  console.log('Added:', added, '| Total signatures now:', after.rows[0].count);
  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
