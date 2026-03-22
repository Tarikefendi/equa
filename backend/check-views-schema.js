const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
async function run() {
  const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaign_views' ORDER BY ordinal_position");
  console.log('campaign_views cols:', cols.rows);
  await pool.end();
}
run().catch(console.error);
