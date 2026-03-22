const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

bcrypt.hash('12345678', 10).then(hash => {
  pool.query("UPDATE users SET password = $1 WHERE username = 'kampanya_sahibi' RETURNING email, username", [hash])
    .then(r => { console.log('Şifre güncellendi:', r.rows[0]); pool.end(); });
});
