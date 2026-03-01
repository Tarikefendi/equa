const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const db = new Database('./backend/data/database.sqlite');

const username = 'quicktest';
const email = 'quick@test.com';
const password = '12345678';

const hashedPassword = bcrypt.hashSync(password, 10);
const userId = uuidv4();

try {
  db.prepare(`
    INSERT INTO users (id, username, email, password, is_verified, is_admin, created_at)
    VALUES (?, ?, ?, ?, 1, 0, datetime('now'))
  `).run(userId, username, email, hashedPassword);

  console.log('✅ Kullanıcı oluşturuldu!');
  console.log('Email:', email);
  console.log('Şifre:', password);
} catch (error) {
  console.error('Hata:', error.message);
}

db.close();
