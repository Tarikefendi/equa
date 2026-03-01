const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const db = new Database('./database.sqlite');

// Admin bilgileri
const email = 'admin@boykot.com';
const username = 'admin';
const password = 'Admin123456';

// Şifreyi hashle
const hashedPassword = bcrypt.hashSync(password, 10);
const userId = crypto.randomBytes(16).toString('hex');

try {
  // Önce var mı kontrol et
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (existing) {
    console.log('❌ Bu email zaten kayıtlı. Şifreyi güncelliyorum...');
    
    // Şifreyi güncelle ve admin yap
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, role = 'admin', is_verified = 1 
      WHERE email = ?
    `).run(hashedPassword, email);
    
    console.log('✅ Şifre güncellendi!');
  } else {
    // Yeni admin oluştur
    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, role, is_verified, reputation_score, created_at)
      VALUES (?, ?, ?, ?, 'admin', 1, 0, datetime('now'))
    `).run(userId, email, username, hashedPassword);
    
    console.log('✅ Yeni admin hesabı oluşturuldu!');
  }
  
  console.log('\n=== 👑 ADMIN GİRİŞ BİLGİLERİ ===');
  console.log(`Email: ${email}`);
  console.log(`Şifre: ${password}`);
  console.log(`Username: ${username}`);
  console.log('\n✅ Bu bilgilerle giriş yapabilirsin!');
  
} catch (error) {
  console.error('❌ Hata:', error.message);
} finally {
  db.close();
}
