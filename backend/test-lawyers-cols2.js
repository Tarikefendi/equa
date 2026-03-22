const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='lawyers' ORDER BY ordinal_position")
  .then(r => { r.rows.forEach(x => console.log(x.column_name, '-', x.data_type)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
