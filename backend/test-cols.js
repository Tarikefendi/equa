const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
  .then(r => { console.log(r.rows.map(x => x.column_name).join(', ')); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
