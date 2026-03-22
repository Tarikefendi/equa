require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function run() {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tables:', tables.rows.map(x => x.table_name).join(', '));

  // notifications tablosu varsa kolonlarını göster
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notifications' ORDER BY ordinal_position");
    console.log('\nnotifications columns:', cols.rows.map(x => `${x.column_name}(${x.data_type})`).join(', '));
  } catch(e) { console.log('notifications table not found'); }

  // signatures tablosu kolonları
  try {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='signatures' ORDER BY ordinal_position");
    console.log('signatures columns:', cols.rows.map(x => x.column_name).join(', '));
  } catch(e) { console.log('signatures table not found'); }

  await pool.end();
}
run().catch(console.error);
