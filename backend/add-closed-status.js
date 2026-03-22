const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check`);
    await client.query(`
      ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check
      CHECK (status = ANY (ARRAY[
        'draft','under_review','active','concluded','response_received',
        'disputed','resolved','archived','closed','closed_unresolved'
      ]))
    `);
    await client.query('COMMIT');
    console.log('✅ campaigns_status_check constraint güncellendi: closed ve closed_unresolved eklendi');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Hata:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
