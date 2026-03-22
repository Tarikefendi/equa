const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const res = await pool.query(
    `SELECT c.id, c.title, c.creator_id, u.username, u.email
     FROM campaigns c
     JOIN users u ON u.id = c.creator_id
     WHERE c.title ILIKE '%migros%'`
  );
  console.log(res.rows);
  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
