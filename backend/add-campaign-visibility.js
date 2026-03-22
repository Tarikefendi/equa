require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  await pool.query(`
    ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
      CHECK (visibility IN ('public', 'unlisted', 'private'))
  `);
  console.log('✅ visibility kolonu eklendi (default: public)');
  await pool.end();
}
run().catch(console.error);
