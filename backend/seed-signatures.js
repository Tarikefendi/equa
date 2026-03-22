const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const campaignId = 'bf23595d5f29083d1f0e649d4be96b51';

async function run() {
  for (let i = 1; i <= 127; i++) {
    await pool.query(
      'INSERT INTO signatures (campaign_id, user_id, is_anonymous, message) VALUES ($1, NULL, true, $2)',
      [campaignId, 'Demo destek #' + i]
    );
  }
  console.log('127 imza eklendi.');
  await pool.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });
