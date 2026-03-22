const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT||'5432'), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
pool.query('SELECT id, title, entity_id, target_entity FROM campaigns ORDER BY created_at').then(r => {
  r.rows.forEach(row => console.log(row.id.substring(0,8), '|', row.entity_id || 'NULL', '|', row.target_entity));
  pool.end();
});
