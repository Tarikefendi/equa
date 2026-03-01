const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(campaigns)").all();
  const hasTargetEmail = tableInfo.some(col => col.name === 'target_email');
  
  if (hasTargetEmail) {
    console.log('✅ target_email column already exists');
  } else {
    // Add the column
    db.prepare('ALTER TABLE campaigns ADD COLUMN target_email TEXT').run();
    console.log('✅ target_email column added successfully');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
