// Migration: Add entity_id to users + institution role
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'boykot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1627',
});

async function migrate() {
  const client = await pool.connect();
  try {
    // 1. Add entity_id column to users
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS entity_id TEXT REFERENCES entities(id) ON DELETE SET NULL
    `);
    console.log('✓ entity_id column added to users');

    // 2. Update role CHECK constraint to include 'institution'
    await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('user', 'moderator', 'admin', 'institution'))
    `);
    console.log('✓ role constraint updated to include institution');

    // 3. Unique constraint: one institution account per entity
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_entity_id_unique
      ON users (entity_id)
      WHERE entity_id IS NOT NULL
    `);
    console.log('✓ unique index on users.entity_id created');

    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
