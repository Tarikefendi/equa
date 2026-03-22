require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
pool.query("SELECT id, title, status, status_change_count_today, status_change_date, status_changed_at FROM campaigns ORDER BY created_at DESC LIMIT 5")
  .then(r => { r.rows.forEach(row => console.log(JSON.stringify(row, null, 2))); pool.end(); });
