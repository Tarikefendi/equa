const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', port:5432, database:'boykot_db', user:'postgres', password:'1627' });
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
  .then(r => { r.rows.forEach(row => console.log(row.table_name)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
