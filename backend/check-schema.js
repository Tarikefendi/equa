const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('=== USERS TABLOSU YAPISI ===\n');

const schema = db.prepare("PRAGMA table_info(users)").all();

schema.forEach(col => {
  console.log(`${col.name} - ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
});

db.close();
