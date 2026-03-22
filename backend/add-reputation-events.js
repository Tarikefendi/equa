require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reputation_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_reputation_events_user_id ON reputation_events(user_id)');
  console.log('✅ reputation_events tablosu oluşturuldu');
  await pool.end();
}
run().catch(console.error);
