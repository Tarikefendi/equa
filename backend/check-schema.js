const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
pool.query("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'campaign_updates'")
  .then(r => { r.rows.forEach(c => console.log(c.column_name, '| nullable:', c.is_nullable, '| default:', c.column_default)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
