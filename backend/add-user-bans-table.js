const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Creating user_bans table...');

db.exec(`
  CREATE TABLE IF NOT EXISTS user_bans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    banned_by TEXT NOT NULL,
    banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unbanned_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_by) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_bans_date ON user_bans(banned_at);
`);

console.log('✅ user_bans table created successfully!');

db.close();
