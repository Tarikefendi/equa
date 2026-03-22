const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaign_updates'")
  .then(r => { r.rows.forEach(x => console.log(x.column_name, '-', x.data_type)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
