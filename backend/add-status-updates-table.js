const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

const sql = `
CREATE TABLE IF NOT EXISTS campaign_status_updates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status_type TEXT NOT NULL CHECK (status_type IN ('in_progress', 'legal_action', 'court_filed', 'hearing_scheduled', 'won', 'partially_won', 'rejected', 'settled', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    documents TEXT,
    is_milestone INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_status_updates_campaign ON campaign_status_updates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_created ON campaign_status_updates(created_at);
`;

try {
  db.exec(sql);
  console.log('✅ campaign_status_updates table created successfully');
} catch (error) {
  console.error('❌ Error:', error.message);
}

db.close();
