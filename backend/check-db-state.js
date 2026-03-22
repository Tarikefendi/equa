const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  const entities = await pool.query('SELECT id, name, slug, verified FROM entities LIMIT 10');
  console.log('Entities:', JSON.stringify(entities.rows, null, 2));

  const user = await pool.query("SELECT id, email FROM users WHERE email = 'testlogin@example.com'");
  console.log('Test user:', JSON.stringify(user.rows, null, 2));

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
