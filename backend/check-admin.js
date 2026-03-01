const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('=== TÜM KULLANICILAR VE ROLLERİ ===\n');

const users = db.prepare(`
  SELECT id, email, username, role, is_verified, created_at 
  FROM users 
  ORDER BY created_at DESC
`).all();

users.forEach(user => {
  console.log(`📧 Email: ${user.email}`);
  console.log(`👤 Username: ${user.username}`);
  console.log(`🎭 Role: ${user.role}`);
  console.log(`✅ Verified: ${user.is_verified ? 'Evet' : 'Hayır'}`);
  console.log(`📅 Oluşturulma: ${user.created_at}`);
  console.log('---');
});

console.log('\n=== ADMIN KULLANICILAR ===\n');
const admins = db.prepare(`
  SELECT email, username, role 
  FROM users 
  WHERE role = 'admin'
`).all();

if (admins.length === 0) {
  console.log('❌ Admin kullanıcı bulunamadı!');
} else {
  admins.forEach(admin => {
    console.log(`👑 ${admin.username} (${admin.email}) - ${admin.role}`);
  });
}

db.close();
