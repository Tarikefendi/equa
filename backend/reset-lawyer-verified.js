const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

pool.query("UPDATE lawyers SET is_verified = 0 WHERE user_id = (SELECT id FROM users WHERE username = 'kampanya_sahibi') RETURNING id, full_name, is_verified")
  .then(r => { console.log('Güncellendi:', r.rows[0]); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });
