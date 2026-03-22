const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'equa',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE entities
      ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✅ entities.verified kolonu eklendi');
  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
