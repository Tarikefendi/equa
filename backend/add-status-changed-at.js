require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
pool.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP')
  .then(() => { console.log('OK'); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
