require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Eski constraint'i kaldır
    await client.query('ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check');
    // Yeni constraint ekle
    await client.query(`
      ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
      CHECK (status IN ('draft','under_review','active','concluded','response_received','disputed','resolved','archived'))
    `);
    await client.query('COMMIT');
    console.log('Constraint updated successfully');
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('Failed:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
