require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function main() {
  const r = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaign_followers') as exists");
  console.log('campaign_followers table exists:', r.rows[0].exists);
  await pool.end();
}
main().catch(console.error);
