require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  const res = await pool.query(
    `SELECT u.username, u.reputation, COUNT(re.id) as event_count
     FROM users u
     LEFT JOIN reputation_events re ON u.id = re.user_id
     WHERE u.email = 'testlogin@example.com'
     GROUP BY u.id, u.username, u.reputation`
  );
  console.log('User reputation:', res.rows);
  await pool.end();
}

main().catch(console.error);
