const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
pool.query("SELECT id, title FROM campaigns WHERE status = 'resolved' AND victory_at IS NOT NULL")
  .then(r => { console.log(r.rows); pool.end(); });
