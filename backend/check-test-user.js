const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
async function check() {
  const u = await pool.query("SELECT id, email, username, role FROM users WHERE email = 'testlogin@example.com'");
  console.log('User:', JSON.stringify(u.rows[0]));
  // Check admin routes index
  const routes = await pool.query("SELECT id, email, role FROM users WHERE role IN ('admin','moderator') LIMIT 5");
  console.log('Admin users:', JSON.stringify(routes.rows));
  await pool.end();
}
check().catch(console.error);
