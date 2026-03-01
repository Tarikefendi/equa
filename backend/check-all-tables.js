const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('=== CHECKING ALL DATABASE TABLES ===\n');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

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

  db.close();
});
