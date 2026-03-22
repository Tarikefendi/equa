const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'boykot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1627',
});

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_updates (
      id SERIAL PRIMARY KEY,
      campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ campaign_updates table created');
  await pool.end();
}

run().catch(console.error);
