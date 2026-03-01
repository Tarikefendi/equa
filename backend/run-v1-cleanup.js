const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔥 V1 CLEANUP MIGRATION BAŞLIYOR...\n');

try {
  // Read SQL file
  const sqlFile = fs.readFileSync(path.join(__dirname, 'v1-cleanup-migration.sql'), 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = sqlFile
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  statements.forEach((statement, index) => {
    try {
      db.exec(statement);
      
      // Log table drops
      if (statement.includes('DROP TABLE')) {
        const tableName = statement.match(/DROP TABLE IF EXISTS (\w+)/)?.[1];
        console.log(`✅ Tablo silindi: ${tableName}`);
        successCount++;
      }
      // Log column drops
      else if (statement.includes('DROP COLUMN')) {
        const match = statement.match(/ALTER TABLE (\w+) DROP COLUMN IF EXISTS (\w+)/);
        if (match) {
          console.log(`✅ Kolon silindi: ${match[1]}.${match[2]}`);
          successCount++;
        }
      }
      // Log deletes
      else if (statement.includes('DELETE FROM')) {
        const tableName = statement.match(/DELETE FROM (\w+)/)?.[1];
        console.log(`✅ Veri temizlendi: ${tableName}`);
        successCount++;
      }
    } catch (error) {
      // Ignore "no such table" errors
      if (!error.message.includes('no such table') && !error.message.includes('no such column')) {
        console.error(`❌ Hata (Statement ${index + 1}):`, error.message);
        errorCount++;
      }
    }
  });

  console.log(`\n📊 ÖZET:`);
  console.log(`✅ Başarılı işlem: ${successCount}`);
  console.log(`❌ Hatalı işlem: ${errorCount}`);
  console.log(`\n🎉 V1 CLEANUP TAMAMLANDI!`);

} catch (error) {
  console.error('❌ Migration hatası:', error);
  process.exit(1);
} finally {
  db.close();
}
