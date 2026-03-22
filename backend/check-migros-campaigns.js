const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const r = await pool.query(
    "SELECT status, COUNT(*) FROM campaigns WHERE entity_id = 'c614766d-6a3b-477e-bd3c-4ac650bc27f9' AND status != 'pending' GROUP BY status"
  );
  console.log('Migros kampanya dağılımı:', r.rows);
  pool.end();
}
run();
