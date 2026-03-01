const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Reports table structure:');
const tableInfo = db.prepare('PRAGMA table_info(reports)').all();
tableInfo.forEach(col => {
  console.log(`- ${col.name} (${col.type})`);
});

db.close();
