import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Adding location fields to campaigns and polls tables...\n');

try {
  // Add country and city to campaigns
  db.exec(`ALTER TABLE campaigns ADD COLUMN country TEXT`);
  console.log('✅ Added country field to campaigns');
} catch (err: any) {
  if (err.message.includes('duplicate column name')) {
    console.log('ℹ️  Country field already exists in campaigns');
  } else {
    throw err;
  }
}

try {
  db.exec(`ALTER TABLE campaigns ADD COLUMN city TEXT`);
  console.log('✅ Added city field to campaigns');
} catch (err: any) {
  if (err.message.includes('duplicate column name')) {
    console.log('ℹ️  City field already exists in campaigns');
  } else {
    throw err;
  }
}

try {
  // Add country and city to polls
  db.exec(`ALTER TABLE polls ADD COLUMN country TEXT`);
  console.log('✅ Added country field to polls');
} catch (err: any) {
  if (err.message.includes('duplicate column name')) {
    console.log('ℹ️  Country field already exists in polls');
  } else {
    throw err;
  }
}

try {
  db.exec(`ALTER TABLE polls ADD COLUMN city TEXT`);
  console.log('✅ Added city field to polls');
} catch (err: any) {
  if (err.message.includes('duplicate column name')) {
    console.log('ℹ️  City field already exists in polls');
  } else {
    throw err;
  }
}

// Create indexes
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_country ON campaigns(country)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_city ON campaigns(city)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_polls_country ON polls(country)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_polls_city ON polls(city)`);
  console.log('✅ Created indexes for location fields');
} catch (err: any) {
  console.log('ℹ️  Indexes already exist');
}

console.log('\n✨ Migration completed successfully!');
console.log('\nAdded fields:');
console.log('  - campaigns.country');
console.log('  - campaigns.city');
console.log('  - polls.country');
console.log('  - polls.city');

db.close();
