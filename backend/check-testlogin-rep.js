require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
async function run() {
  const r = await p.query('SELECT username, email, reputation FROM users WHERE email = $1', ['testlogin@example.com']);
  console.log(r.rows[0]);
  await p.end();
}
run().catch(e => { console.log(e.message); p.end(); });
