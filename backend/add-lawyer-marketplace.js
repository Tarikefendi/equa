const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'boykot_db',
  user: 'postgres',
  password: '1627',
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lawyers table — verified lawyers on the platform
    await client.query(`
      CREATE TABLE IF NOT EXISTS lawyers (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        expertise TEXT NOT NULL,
        bar_number TEXT,
        city TEXT,
        bio TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Legal requests — campaign owner requests legal support
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_requests (
        id TEXT PRIMARY KEY,
        campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
        requester_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'closed')),
        matched_lawyer_id TEXT REFERENCES lawyers(id) ON DELETE SET NULL,
        matched_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id)
      )
    `);

    // Lawyer applications — lawyers express interest in a legal request
    await client.query(`
      CREATE TABLE IF NOT EXISTS lawyer_applications (
        id TEXT PRIMARY KEY,
        legal_request_id TEXT REFERENCES legal_requests(id) ON DELETE CASCADE,
        lawyer_id TEXT REFERENCES lawyers(id) ON DELETE CASCADE,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(legal_request_id, lawyer_id)
      )
    `);

    await client.query('COMMIT');
    console.log('Lawyer marketplace migration completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
