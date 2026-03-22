require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function run() {
  // Check constraint
  const c = await pool.query(
    "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'campaigns'::regclass AND contype = 'c'"
  );
  console.log('Constraints:');
  c.rows.forEach(r => console.log(' ', r.conname, ':', r.def));

  // Try updating a campaign status to disputed
  const camp = await pool.query("SELECT id, status FROM campaigns LIMIT 1");
  if (camp.rows.length > 0) {
    const id = camp.rows[0].id;
    console.log('\nTest campaign:', id, 'current status:', camp.rows[0].status);
    try {
      await pool.query("UPDATE campaigns SET status = 'disputed' WHERE id = $1", [id]);
      console.log('UPDATE disputed: OK');
      // revert
      await pool.query("UPDATE campaigns SET status = $1 WHERE id = $2", [camp.rows[0].status, id]);
    } catch(e) {
      console.log('UPDATE disputed FAILED:', e.message);
    }
  }
  await pool.end();
}
run();
