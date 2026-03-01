const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Adding resolution column to reports table...');

try {
  // Check if column exists
  const tableInfo = db.prepare('PRAGMA table_info(reports)').all();
  const hasResolution = tableInfo.some(col => col.name === 'resolution');
  
  if (!hasResolution) {
    db.exec('ALTER TABLE reports ADD COLUMN resolution TEXT;');
    console.log('✅ Resolution column added successfully!');
  } else {
    console.log('✅ Resolution column already exists!');
  }
} catch (error) {
  console.error('Error:', error.message);
}

db.close();
