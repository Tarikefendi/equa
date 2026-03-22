require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
async function run() {
  await pool.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status_change_count_today INTEGER DEFAULT 0');
  await pool.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status_change_date DATE');
  console.log('OK');
  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
