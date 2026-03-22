require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
pool.query("SELECT id, title, status, status_changed_at, NOW() as now FROM campaigns ORDER BY created_at DESC LIMIT 5")
  .then(r => {
    r.rows.forEach(row => {
      const diff = row.status_changed_at ? ((new Date(row.now) - new Date(row.status_changed_at)) / 1000 / 60).toFixed(1) : null;
      console.log(`${row.title?.substring(0,30)} | status: ${row.status} | changed_at: ${row.status_changed_at} | diff: ${diff} dk`);
    });
    pool.end();
  });
