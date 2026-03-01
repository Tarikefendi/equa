const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Get all users
console.log('\n=== KULLANICILAR ===');
const users = db.prepare('SELECT id, email, username, role FROM users').all();
users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}`);
});

// Make testuser admin
const testuser = users.find(u => u.username === 'testuser');
if (testuser) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', testuser.id);
  console.log(`\n✅ ${testuser.username} is now ADMIN!`);
} else {
  console.log('\n❌ testuser not found');
}

db.close();
