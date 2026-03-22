const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function check() {
  const [r1, r2, r3] = await Promise.all([
    pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='campaigns' AND column_name='share_count'"),
    pool.query("SELECT to_regclass('public.campaign_shares') as t"),
    pool.query("SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%share%'"),
  ]);
  console.log('share_count column exists:', r1.rows.length > 0);
  console.log('campaign_shares table exists:', r2.rows[0].t !== null);
  console.log('share-related functions:', r3.rows.map(r => r.routine_name));
  await pool.end();
}
check().catch(e => { console.error(e.message); pool.end(); });
