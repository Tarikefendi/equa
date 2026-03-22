const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setup() {
  console.log('Setting up Railway database...');
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        reputation INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        entity_id TEXT,
        device_fingerprint TEXT,
        last_ip TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ users');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        full_name TEXT,
        bio TEXT,
        country TEXT,
        language TEXT DEFAULT 'tr',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ user_profiles');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ refresh_tokens');

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
    console.log('✅ verification_tokens');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        type TEXT DEFAULT 'company',
        description TEXT,
        website TEXT,
        country TEXT,
        verified BOOLEAN DEFAULT false,
        follower_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ entities');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS entity_followers (
        id SERIAL PRIMARY KEY,
        entity_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(entity_id, user_id)
      )
    `);
    console.log('✅ entity_followers');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        summary TEXT,
        status TEXT DEFAULT 'pending',
        category TEXT,
        creator_id TEXT,
        entity_id TEXT,
        entity_name TEXT,
        is_public BOOLEAN DEFAULT true,
        investigation_mode BOOLEAN DEFAULT false,
        demanded_action TEXT,
        standard_reference TEXT,
        standard_reference_other TEXT,
        standard_id INTEGER,
        response_deadline_days INTEGER DEFAULT 30,
        response_deadline_date TIMESTAMP,
        target_type TEXT DEFAULT 'company',
        target_email TEXT,
        views INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        victory_at TIMESTAMP,
        victory_support_count INTEGER,
        last_activity_at TIMESTAMP DEFAULT NOW(),
        resolution_reason TEXT,
        archived_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ campaigns');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS signatures (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT,
        message TEXT,
        is_anonymous BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id, user_id)
      )
    `);
    console.log('✅ signatures');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_updates (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT,
        type TEXT DEFAULT 'general',
        title TEXT,
        content TEXT NOT NULL,
        source_url TEXT,
        is_pinned BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ campaign_updates');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_update_history (
        id SERIAL PRIMARY KEY,
        update_id INTEGER NOT NULL,
        content TEXT,
        title TEXT,
        edited_by TEXT,
        edit_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ campaign_update_history');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_status_history (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        reason TEXT,
        changed_by TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ campaign_status_history');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_views (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ campaign_views');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_followers (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id, user_id)
      )
    `);
    console.log('✅ campaign_followers');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_reports (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(campaign_id, user_id)
      )
    `);
    console.log('✅ campaign_reports');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_shares (
        id SERIAL PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT,
        platform TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ campaign_shares');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        user_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT,
        status TEXT DEFAULT 'pending',
        credibility_type TEXT DEFAULT 'user_submission',
        flag_count INTEGER DEFAULT 0,
        verification_source TEXT DEFAULT 'pending_review',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ evidence');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS evidence_flags (
        id SERIAL PRIMARY KEY,
        evidence_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(evidence_id, user_id)
      )
    `);
    console.log('✅ evidence_flags');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        entity_type TEXT,
        entity_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ notifications');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reputation_events (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        points INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ reputation_events');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS entity_metrics (
        id SERIAL PRIMARY KEY,
        entity_id TEXT UNIQUE NOT NULL,
        campaign_count INTEGER DEFAULT 0,
        response_count INTEGER DEFAULT 0,
        resolved_count INTEGER DEFAULT 0,
        no_response_count INTEGER DEFAULT 0,
        avg_response_time_days FLOAT DEFAULT 0,
        response_rate FLOAT DEFAULT 0,
        last_calculated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ entity_metrics');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS entity_transparency_metrics (
        id SERIAL PRIMARY KEY,
        entity_id TEXT UNIQUE NOT NULL,
        total_campaigns INTEGER DEFAULT 0,
        response_received INTEGER DEFAULT 0,
        resolved_campaigns INTEGER DEFAULT 0,
        ignored_campaigns INTEGER DEFAULT 0,
        average_response_days FLOAT DEFAULT 0,
        transparency_score FLOAT DEFAULT 0,
        last_calculated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ entity_transparency_metrics');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS standard_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ standard_categories');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS standards (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        source_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ standards');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS standard_suggestions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        source_url TEXT,
        suggested_by TEXT,
        ai_confidence FLOAT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ standard_suggestions');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lawyers (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        expertise TEXT,
        bar_number TEXT,
        city TEXT,
        bio TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ lawyers');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS legal_requests (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        requester_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        matched_lawyer_id TEXT,
        matched_at TIMESTAMP,
        reopen_count INTEGER DEFAULT 0,
        last_reopened_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ legal_requests');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lawyer_applications (
        id SERIAL PRIMARY KEY,
        legal_request_id TEXT NOT NULL,
        lawyer_id TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(legal_request_id, lawyer_id)
      )
    `);
    console.log('✅ lawyer_applications');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_bans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        reason TEXT,
        banned_by TEXT,
        banned_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ user_bans');

    // Create admin user
    const bcrypt = require('bcrypt');
    const { randomBytes } = require('crypto');
    const hash = await bcrypt.hash('12345678', 12);
    const userId = randomBytes(16).toString('hex');

    await pool.query(`
      INSERT INTO users (id, email, username, password_hash, role, is_verified)
      VALUES ($1, 'testlogin@example.com', 'testlogin', $2, 'admin', true)
      ON CONFLICT (email) DO NOTHING
    `, [userId, hash]);
    console.log('✅ Admin user created (testlogin@example.com / 12345678)');

    await pool.query(`
      INSERT INTO user_profiles (user_id) 
      SELECT id FROM users WHERE email = 'testlogin@example.com'
      ON CONFLICT DO NOTHING
    `);

    console.log('\n🎉 Railway DB setup complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
