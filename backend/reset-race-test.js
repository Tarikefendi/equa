const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function main() {
  const campId = 'b9ff659f13e4ece819e855c9cb0f3cc4';
  const lrId = '551c019f6e34e05c8bac2ef81a21826d';

  await pool.query(`UPDATE legal_requests SET status = 'pending', matched_lawyer_id = NULL, matched_at = NULL, reopen_count = 0, last_reopened_at = NULL WHERE id = $1`, [lrId]);
  await pool.query(`DELETE FROM lawyer_applications WHERE legal_request_id = $1`, [lrId]);
  await pool.query(`DELETE FROM campaign_updates WHERE campaign_id = $1 AND type = 'lawyer_matched'`, [campId]);
  await pool.query(`DELETE FROM notifications WHERE type IN ('lawyer_matched', 'lawyer_unmatched')`);

  console.log('Reset tamam — legal request pending durumuna döndü.');
  console.log('Kampanya URL:', `http://localhost:3000/campaigns/${campId}`);
  console.log('Lawyers URL :', 'http://localhost:3000/lawyers');
  await pool.end();
}
main().catch(console.error);
