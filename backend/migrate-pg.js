const { Pool } = require('pg');
const pool = new Pool({ host:'localhost', port:5432, database:'boykot_db', user:'postgres', password:'1627' });

async function migrate() {
  try {
    console.log('Running migrations...');

    // Add V2 campaign fields if missing
    const v2Fields = [
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS standard_reference TEXT",
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS standard_reference_other TEXT",
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS demanded_action TEXT",
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS response_deadline_days INTEGER DEFAULT 30",
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS response_deadline_date TIMESTAMP",
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_to_organization_at TIMESTAMP",
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'company'",
      "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_email TEXT",
    ];

    for (const sql of v2Fields) {
      await pool.query(sql);
      console.log('OK:', sql.substring(0, 60));
    }

    // Ensure other tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        vote_choice TEXT NOT NULL DEFAULT 'support',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS signatures (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT,
        name TEXT,
        email TEXT,
        is_anonymous INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        is_read INTEGER DEFAULT 0,
        entity_type TEXT,
        entity_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        resolution TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS organization_responses (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        organization_name TEXT NOT NULL,
        organization_email TEXT,
        response_text TEXT NOT NULL,
        response_type TEXT NOT NULL,
        contact_person TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_status_updates (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        documents TEXT,
        is_milestone INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_history (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        email_type TEXT NOT NULL,
        subject TEXT,
        content TEXT,
        signature_count INTEGER DEFAULT 0,
        sent_by TEXT,
        sent_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_bans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        reason TEXT,
        banned_by TEXT,
        banned_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        full_name TEXT,
        bio TEXT,
        country TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('\nAll migrations done!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
