const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
async function run() {
  const t = await pool.query("SELECT to_regclass('campaign_reports') as t");
  console.log('campaign_reports table:', t.rows[0].t);
  if (t.rows[0].t) {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='campaign_reports' ORDER BY ordinal_position");
    console.log('cols:', cols.rows.map(r => r.column_name).join(', '));
  }
  await pool.end();
}
run().catch(console.error);
