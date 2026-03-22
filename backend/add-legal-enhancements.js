const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function main() {
  // Add reopened status to legal_requests
  await pool.query(`
    ALTER TABLE legal_requests
    ADD COLUMN IF NOT EXISTS reopen_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_reopened_at TIMESTAMP
  `);
  console.log('legal_requests columns added');

  // Add active_case_count tracking to lawyers (computed, but we track via query)
  // No schema change needed — we query legal_requests for count

  await pool.end();
  console.log('Done');
}
main().catch(console.error);
