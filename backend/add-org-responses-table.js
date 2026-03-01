const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organization_responses (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      campaign_id TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      organization_email TEXT NOT NULL,
      response_text TEXT NOT NULL,
      response_type TEXT NOT NULL CHECK (response_type IN ('official', 'statement', 'action_taken')),
      contact_person TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_organization_responses_campaign ON organization_responses(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_organization_responses_verified ON organization_responses(is_verified);
  `);

  console.log('✅ organization_responses table created successfully');
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
