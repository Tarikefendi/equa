const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
async function run() {
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'campaigns' ORDER BY ordinal_position");
  console.log('campaigns cols:', cols.rows.map(r => r.column_name).join(', '));
  const tbl = await pool.query("SELECT to_regclass('campaign_views') as t");
  console.log('campaign_views table:', tbl.rows[0].t);
  await pool.end();
}
run().catch(console.error);
