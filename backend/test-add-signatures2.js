const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
const { randomBytes } = require('crypto');

const CAMPAIGN_ID = '750f9b1a18495655bb8b5cadefaeb92f';

async function run() {
  const current = await pool.query('SELECT COUNT(*) FROM signatures WHERE campaign_id = $1', [CAMPAIGN_ID]);
  const currentCount = parseInt(current.rows[0].count);
  console.log('Current signatures:', currentCount);

  const needed = Math.max(0, 55 - currentCount);
  console.log('Need to add:', needed);

  for (let i = 0; i < needed; i++) {
    // Sahte kullanıcı oluştur
    const userId = randomBytes(16).toString('hex');
    const email = `testuser_${userId.slice(0,8)}@fake.equa`;
    const username = `testuser_${userId.slice(0,8)}`;

    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, role, is_verified)
       VALUES ($1, $2, $3, 'fakehash', 'user', 1)
       ON CONFLICT DO NOTHING`,
      [userId, email, username]
    );

    const sigId = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO signatures (id, campaign_id, user_id, is_anonymous, created_at)
       VALUES ($1, $2, $3, true, NOW() - ($4 || ' minutes')::interval)
       ON CONFLICT DO NOTHING`,
      [sigId, CAMPAIGN_ID, userId, i]
    );
  }

  const after = await pool.query('SELECT COUNT(*) FROM signatures WHERE campaign_id = $1', [CAMPAIGN_ID]);
  console.log('Total signatures now:', after.rows[0].count);
  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
