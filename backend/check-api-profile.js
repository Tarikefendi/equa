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
  // Simulate what getProfile returns
  const result = await pool.query(
    `SELECT u.id, u.email, u.username, u.reputation, u.is_public, u.created_at, u.is_verified, u.role,
            p.full_name, p.bio, p.avatar_url, p.country, p.language
     FROM users u
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.email = 'testlogin@example.com'`,
  );
  console.log('Profile data:', JSON.stringify(result.rows[0], null, 2));
  await pool.end();
}

main().catch(console.error);
