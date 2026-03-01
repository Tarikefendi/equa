const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('\n=== KULLANICILAR ===');
const users = db.prepare('SELECT id, email, username FROM users').all();
users.forEach(user => {
  console.log(`Email: ${user.email} | Username: ${user.username}`);
});

console.log('\n=== KAMPANYALAR (target_email olan) ===');
const campaigns = db.prepare(`
  SELECT c.id, c.title, c.target_email, u.email as creator_email, u.username as creator_username
  FROM campaigns c
  LEFT JOIN users u ON c.creator_id = u.id
  WHERE c.target_email IS NOT NULL
  ORDER BY c.created_at DESC
  LIMIT 5
`).all();

campaigns.forEach(camp => {
  console.log(`\nKampanya: ${camp.title}`);
  console.log(`  Hedef Email: ${camp.target_email}`);
  console.log(`  Oluşturan: ${camp.creator_username} (${camp.creator_email})`);
  console.log(`  ID: ${camp.id}`);
});

db.close();
