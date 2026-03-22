const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add credibility_type column
    await client.query(`
      ALTER TABLE campaign_evidence
      ADD COLUMN IF NOT EXISTS credibility_type VARCHAR(50) DEFAULT 'user_submission'
    `);

    // Add flag_count column
    await client.query(`
      ALTER TABLE campaign_evidence
      ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0
    `);

    // Update status constraint to include 'flagged'
    await client.query(`
      ALTER TABLE campaign_evidence
      DROP CONSTRAINT IF EXISTS campaign_evidence_status_check
    `);

    await client.query(`
      ALTER TABLE campaign_evidence
      ADD CONSTRAINT campaign_evidence_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'flagged'))
    `);

    // Create evidence_flags table to track who flagged what
    await client.query(`
      CREATE TABLE IF NOT EXISTS evidence_flags (
        id SERIAL PRIMARY KEY,
        evidence_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(evidence_id, user_id)
      )
    `);

    await client.query('COMMIT');
    console.log('Migration başarılı: evidence credibility alanları eklendi');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration hatası:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
