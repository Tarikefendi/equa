const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Create email_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_history (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      campaign_id TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      email_type TEXT NOT NULL CHECK (email_type IN ('campaign_notification', 'manual_send', 'milestone')),
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      signature_count INTEGER DEFAULT 0,
      sent_by TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_email_history_campaign ON email_history(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);
  `);

  console.log('✅ email_history table created successfully');
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
