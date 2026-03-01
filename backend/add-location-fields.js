const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Adding location fields to campaigns and polls tables...\n');

const sql = fs.readFileSync(path.join(__dirname, 'add-location-fields.sql'), 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Location fields added successfully!');
  console.log('\nAdded fields:');
  console.log('  - campaigns.country');
  console.log('  - campaigns.city');
  console.log('  - polls.country');
  console.log('  - polls.city');
  console.log('\nIndexes created for better search performance.');
  
  db.close();
});
