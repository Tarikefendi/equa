const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT||'5432'), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS entity_followers (
      id SERIAL PRIMARY KEY,
      entity_id VARCHAR NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(entity_id, user_id)
    )
  `);
  console.log('✅ entity_followers tablosu oluşturuldu');
  await pool.end();
}
run().catch(console.error);
