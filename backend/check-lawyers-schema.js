const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'lawyers'")
  .then(r => { r.rows.forEach(c => console.log(c.column_name, '|', c.is_nullable)); pool.end(); });
