const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

pool.query("SELECT id, email, username, role FROM users WHERE username = 'kampanya_sahibi'")
  .then(r => { console.log(r.rows); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
