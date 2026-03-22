require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'boykot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1627',
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE campaign_updates
      ADD COLUMN IF NOT EXISTS source_url TEXT;
    `);
    console.log('source_url kolonu eklendi (veya zaten vardi).');
  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

run();
