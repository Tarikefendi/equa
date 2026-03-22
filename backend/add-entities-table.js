require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // entities tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        website TEXT,
        country TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // campaigns tablosuna entity_id ekle
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS entity_id TEXT REFERENCES entities(id) ON DELETE SET NULL
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_entities_slug ON entities(slug)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_entity ON campaigns(entity_id)`);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
