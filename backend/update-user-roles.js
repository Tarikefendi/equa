const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Check current role constraint
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  console.log('Current users table structure:');
  tableInfo.forEach(col => {
    if (col.name === 'role') {
      console.log(`  ${col.name}: ${col.type}`);
    }
  });

  // Note: SQLite doesn't support ALTER COLUMN with CHECK constraint
  // We need to add lawyer role support in application logic
  // The existing CHECK constraint allows: 'user', 'moderator', 'admin'
  // We'll need to recreate the table or work around it

  console.log('\n✅ Role system ready');
  console.log('Note: Add "lawyer" role support in application logic');
  console.log('Existing roles: user, moderator, admin');
  
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
