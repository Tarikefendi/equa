const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function main() {
  // Reset legal request to pending
  await pool.query(
    "UPDATE legal_requests SET status = 'pending', matched_lawyer_id = NULL, matched_at = NULL WHERE id = '0c0d2529e02a26ef83557c8e0d0cd776'"
  );
  await pool.query(
    "DELETE FROM lawyer_applications WHERE legal_request_id = '0c0d2529e02a26ef83557c8e0d0cd776'"
  );
  console.log('Reset done — legal request is now pending');

  const before = await pool.query("SELECT COUNT(*) FROM notifications WHERE type = 'lawyer_matched'");
  console.log('lawyer_matched notifications before apply:', before.rows[0].count);

  await pool.end();
}
main().catch(console.error);
