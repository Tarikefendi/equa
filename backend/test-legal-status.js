const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const CAMPAIGN_ID = '750f9b1a18495655bb8b5cadefaeb92f';

async function run() {
  // Campaign info
  const c = await pool.query('SELECT id, title, status, creator_id, response_deadline_date FROM campaigns WHERE id = $1', [CAMPAIGN_ID]);
  console.log('Campaign:', JSON.stringify(c.rows[0], null, 2));

  // Signature count
  const s = await pool.query('SELECT COUNT(*) FROM signatures WHERE campaign_id = $1', [CAMPAIGN_ID]);
  console.log('Signature count:', s.rows[0].count);

  // Creator user
  const u = await pool.query('SELECT id, email FROM users WHERE id = $1', [c.rows[0].creator_id]);
  console.log('Creator:', JSON.stringify(u.rows[0], null, 2));

  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
