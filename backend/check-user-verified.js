const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

const email = process.argv[2] || 'verify-test@test.com';

const user = db.prepare(`
  SELECT email, username, is_verified, created_at 
  FROM users 
  WHERE email = ?
`).get(email);

if (user) {
  console.log('User:', user.username);
  console.log('Email:', user.email);
  console.log('Verified:', user.is_verified === 1 ? '✅ YES' : '❌ NO');
  console.log('Created:', user.created_at);
} else {
  console.log('User not found');
}

db.close();
