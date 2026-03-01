import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('=== CHECKING ALL DATABASE TABLES ===\n');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];

console.log(`Total tables found: ${tables.length}\n`);

tables.forEach((table, index) => {
  console.log(`${index + 1}. ${table.name}`);
});

console.log('\n=== EXPECTED TABLES FROM SCHEMA ===\n');

const expectedTables = [
  'users',
  'user_profiles',
  'campaigns',
  'votes',
  'refresh_tokens',
  'verification_tokens',
  'comments',
  'role_permissions',
  'activity_logs',
  'uploads',
  'notifications',
  'reports',
  'user_badges',
  'campaign_milestones',
  'signatures',
  'email_history',
  'organization_responses',
  'legal_applications',
  'status_updates',
  'campaign_followers',
  'share_clicks',
  'notification_preferences',
  'lawyers',
  'lawyer_profiles',
  'user_bans'
];

console.log(`Expected tables: ${expectedTables.length}\n`);

const existingTableNames = tables.map(t => t.name);
const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
const extraTables = existingTableNames.filter(t => !expectedTables.includes(t) && !t.startsWith('sqlite_'));

if (missingTables.length > 0) {
  console.log('\n❌ MISSING TABLES:');
  missingTables.forEach(t => console.log(`  - ${t}`));
} else {
  console.log('\n✅ All expected tables exist!');
}

if (extraTables.length > 0) {
  console.log('\n⚠️  EXTRA TABLES (not in expected list):');
  extraTables.forEach(t => console.log(`  - ${t}`));
}

console.log('\n=== CHECKING TABLE STRUCTURES ===\n');

// Check each expected table structure
for (const tableName of expectedTables) {
  if (existingTableNames.includes(tableName)) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    console.log(`✅ ${tableName} (${columns.length} columns)`);
  }
}

db.close();
console.log('\n=== CHECK COMPLETE ===');
