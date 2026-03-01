const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

async function createTestUser() {
  const email = 'testlogin@example.com';
  const username = 'testlogin';
  const password = '12345678';
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Check if user exists
  const existing = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username);
  
  if (existing) {
    console.log('❌ Kullanıcı zaten var, siliniyor...');
    db.prepare('DELETE FROM users WHERE email = ? OR username = ?').run(email, username);
  }
  
  // Create user
  db.prepare(`
    INSERT INTO users (email, username, password_hash, is_verified, reputation_score, created_at)
    VALUES (?, ?, ?, 1, 0, datetime('now'))
  `).run(email, username, hashedPassword);
  
  console.log('✅ Test kullanıcısı oluşturuldu!');
  console.log('📧 Email:', email);
  console.log('👤 Username:', username);
  console.log('🔑 Password:', password);
}

createTestUser().catch(console.error);
