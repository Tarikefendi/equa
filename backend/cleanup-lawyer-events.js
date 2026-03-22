const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
async function main() {
  const res = await pool.query(
    `DELETE FROM campaign_updates
     WHERE type = 'lawyer_matched'
     AND id NOT IN (
       SELECT MIN(id) FROM campaign_updates
       WHERE type = 'lawyer_matched'
       GROUP BY campaign_id
     )`
  );
  console.log('Deleted duplicate lawyer_matched events:', res.rowCount);
  await pool.end();
}
main().catch(console.error);
