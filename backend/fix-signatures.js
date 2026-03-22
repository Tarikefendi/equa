const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function fix() {
  await p.query('ALTER TABLE signatures ALTER COLUMN user_id DROP NOT NULL');
  console.log('user_id is now nullable - anonymous signatures supported');
  p.end();
}

fix().catch(e => { console.error(e.message); p.end(); });
