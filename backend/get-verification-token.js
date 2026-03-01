const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

const email = process.argv[2] || 'verify-test@test.com';

const result = db.prepare(`
  SELECT token FROM verification_tokens 
  WHERE user_id = (SELECT id FROM users WHERE email = ?) 
  AND type = 'email_verification' 
  ORDER BY created_at DESC 
  LIMIT 1
`).get(email);

if (result) {
  console.log('Token:', result.token);
} else {
  console.log('No token found');
}

db.close();
