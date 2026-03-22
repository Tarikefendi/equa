const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

pool.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS summary TEXT')
  .then(() => { console.log('✅ campaigns.summary kolonu eklendi'); pool.end(); })
  .catch(e => { console.error('HATA:', e.message); pool.end(); });
