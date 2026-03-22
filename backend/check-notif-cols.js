const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position")
  .then(r => { console.log(r.rows.map(x => x.column_name)); pool.end(); });
