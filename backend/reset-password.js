const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function reset() {
  const hash = await bcrypt.hash('12345678', 10);
  await pool.query("UPDATE users SET password_hash = $1, is_verified = 1 WHERE username = 'kampanya_sahibi'", [hash]);
  console.log('Şifre güncellendi:', hash);
  await pool.end();
}

reset().catch(console.error);
