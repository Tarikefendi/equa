/**
 * migrate-all.js
 * Railway (veya herhangi bir PostgreSQL) DB'ye tüm schema migration'larını uygular.
 * Tüm sorgular IF NOT EXISTS / IF EXISTS kullandığı için güvenle tekrar çalıştırılabilir.
 *
 * Kullanım:
 *   node migrate-all.js                        → local .env'den bağlanır
 *   DATABASE_URL=postgres://... node migrate-all.js  → Railway için
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'boykot_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '1627',
      }
);

async function run(label, sql) {
  try {
    await pool.query(sql);
    console.log('✅', label);
  } catch (e) {
    console.error('❌', label, '→', e.message.split('\n')[0]);
  }
}

async function main() {
  console.log('🚀 EQUA — Full DB Migration başlıyor...\n');

  // ─── CORE TABLES ────────────────────────────────────────────────────────────

  await run('users tablosu', `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK (role IN ('user','moderator','admin','institution')),
      is_verified BOOLEAN DEFAULT false,
      is_banned BOOLEAN DEFAULT false,
      verification_token TEXT,
      verification_token_expires TIMESTAMP,
      reset_token TEXT,
      reset_token_expires TIMESTAMP,
      reputation INTEGER DEFAULT 0,
      reputation_score INTEGER DEFAULT 0,
      entity_id TEXT,
      profile_public BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('entities tablosu', `
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      type TEXT CHECK (type IN ('company','government','organization','person','other')),
      description TEXT,
      website TEXT,
      country TEXT,
      verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('campaigns tablosu', `
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title TEXT NOT NULL,
      description TEXT,
      summary TEXT,
      status TEXT DEFAULT 'active' CHECK (status = ANY (ARRAY[
        'draft','under_review','active','concluded','response_received',
        'disputed','resolved','archived','closed','closed_unresolved','no_response'
      ])),
      category TEXT,
      creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      entity_id TEXT REFERENCES entities(id) ON DELETE SET NULL,
      entity_name TEXT,
      is_public BOOLEAN DEFAULT true,
      visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','unlisted','private')),
      investigation_mode BOOLEAN DEFAULT false,
      demanded_action TEXT,
      standard_reference TEXT,
      standard_reference_other TEXT,
      standard_id INTEGER,
      response_deadline_days INTEGER DEFAULT 30,
      response_deadline_date TIMESTAMP,
      target_type TEXT,
      target_email TEXT,
      case_number TEXT UNIQUE,
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

  await run('signatures tablosu', `
    CREATE TABLE IF NOT EXISTS signatures (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT,
      is_anonymous BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(campaign_id, user_id)
    )
  `);

  await run('campaign_updates tablosu', `
    CREATE TABLE IF NOT EXISTS campaign_updates (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT DEFAULT 'general' CHECK (type IN ('general','media','official_response','status_change','lawyer_matched')),
      title TEXT,
      content TEXT NOT NULL,
      source_url TEXT,
      is_pinned BOOLEAN DEFAULT false,
      edit_history JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('campaign_evidence tablosu', `
    CREATE TABLE IF NOT EXISTS campaign_evidence (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('link','document','image')),
      title TEXT NOT NULL,
      description TEXT,
      url TEXT,
      file_path TEXT,
      added_by TEXT REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','flagged')),
      credibility_type TEXT DEFAULT 'user_submission',
      flag_count INTEGER DEFAULT 0,
      verification_source TEXT DEFAULT 'pending_review',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('campaign_followers tablosu', `
    CREATE TABLE IF NOT EXISTS campaign_followers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(campaign_id, user_id)
    )
  `);

  await run('campaign_reports tablosu', `
    CREATE TABLE IF NOT EXISTS campaign_reports (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(campaign_id, user_id)
    )
  `);

  await run('campaign_status_history tablosu', `
    CREATE TABLE IF NOT EXISTS campaign_status_history (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by TEXT REFERENCES users(id),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('campaign_views tablosu', `
    CREATE TABLE IF NOT EXISTS campaign_views (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      ip_address TEXT,
      viewer_key TEXT,
      viewed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('campaign_shares tablosu', `
    CREATE TABLE IF NOT EXISTS campaign_shares (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      platform TEXT DEFAULT 'other',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('entity_followers tablosu', `
    CREATE TABLE IF NOT EXISTS entity_followers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(entity_id, user_id)
    )
  `);

  await run('entity_metrics tablosu', `
    CREATE TABLE IF NOT EXISTS entity_metrics (
      id SERIAL PRIMARY KEY,
      entity_id TEXT UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
      campaign_count INTEGER DEFAULT 0,
      response_count INTEGER DEFAULT 0,
      resolved_count INTEGER DEFAULT 0,
      no_response_count INTEGER DEFAULT 0,
      avg_response_time_days INTEGER,
      response_rate FLOAT,
      last_calculated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('entity_transparency_metrics tablosu', `
    CREATE TABLE IF NOT EXISTS entity_transparency_metrics (
      id SERIAL PRIMARY KEY,
      entity_id TEXT UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
      total_campaigns INTEGER DEFAULT 0,
      response_received INTEGER DEFAULT 0,
      resolved_campaigns INTEGER DEFAULT 0,
      ignored_campaigns INTEGER DEFAULT 0,
      average_response_days INTEGER,
      transparency_score INTEGER,
      last_calculated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('notifications tablosu', `
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      entity_type TEXT,
      entity_id TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('evidence_flags tablosu', `
    CREATE TABLE IF NOT EXISTS evidence_flags (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      evidence_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(evidence_id, user_id)
    )
  `);

  await run('votes tablosu', `
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vote_choice TEXT NOT NULL CHECK (vote_choice IN ('support','oppose','neutral')),
      vote_hash TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(campaign_id, user_id)
    )
  `);

  await run('standard_categories tablosu', `
    CREATE TABLE IF NOT EXISTS standard_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('standards tablosu', `
    CREATE TABLE IF NOT EXISTS standards (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES standard_categories(id),
      source_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('standard_suggestions tablosu', `
    CREATE TABLE IF NOT EXISTS standard_suggestions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES standard_categories(id),
      source_url TEXT,
      suggested_by TEXT REFERENCES users(id),
      ai_confidence FLOAT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('lawyers tablosu', `
    CREATE TABLE IF NOT EXISTS lawyers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      expertise TEXT NOT NULL,
      bar_number TEXT,
      city TEXT,
      bio TEXT,
      is_verified BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('legal_requests tablosu', `
    CREATE TABLE IF NOT EXISTS legal_requests (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
      requester_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending','matched','closed')),
      matched_lawyer_id TEXT REFERENCES lawyers(id) ON DELETE SET NULL,
      matched_at TIMESTAMP,
      reopen_count INTEGER DEFAULT 0,
      last_reopened_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(campaign_id)
    )
  `);

  await run('lawyer_applications tablosu', `
    CREATE TABLE IF NOT EXISTS lawyer_applications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      legal_request_id TEXT REFERENCES legal_requests(id) ON DELETE CASCADE,
      lawyer_id TEXT REFERENCES lawyers(id) ON DELETE CASCADE,
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(legal_request_id, lawyer_id)
    )
  `);

  await run('user_bans tablosu', `
    CREATE TABLE IF NOT EXISTS user_bans (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      banned_by TEXT REFERENCES users(id),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('reputation_events tablosu', `
    CREATE TABLE IF NOT EXISTS reputation_events (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      points INTEGER NOT NULL,
      reference_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('activity_logs tablosu', `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details JSONB DEFAULT '{}',
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await run('email_history tablosu', `
    CREATE TABLE IF NOT EXISTS email_history (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      to_email TEXT NOT NULL,
      subject TEXT,
      type TEXT,
      status TEXT DEFAULT 'sent',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ─── SEQUENCES ───────────────────────────────────────────────────────────────

  await run('campaign_case_seq sequence', `CREATE SEQUENCE IF NOT EXISTS campaign_case_seq START 1`);

  // ─── ALTER TABLE — eksik kolonlar ────────────────────────────────────────────

  await run('users.entity_id FK', `ALTER TABLE users ADD COLUMN IF NOT EXISTS entity_id TEXT REFERENCES entities(id) ON DELETE SET NULL`);
  await run('users.reputation_score', `ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0`);
  await run('campaigns.target_entity', `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_entity TEXT`);
  await run('campaigns.goals', `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{}'`);
  await run('campaigns.evidence', `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS evidence TEXT`);
  await run('campaigns.tags', `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tags TEXT[]`);
  await run('campaign_updates.author_id', `ALTER TABLE campaign_updates ADD COLUMN IF NOT EXISTS author_id TEXT REFERENCES users(id) ON DELETE SET NULL`);
  await run('campaigns.standard_id FK', `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS standard_id INTEGER REFERENCES standards(id)`);

  // ─── INDEXES ─────────────────────────────────────────────────────────────────

  const indexes = [
    ['idx_campaigns_status', 'campaigns(status)'],
    ['idx_campaigns_entity', 'campaigns(entity_id)'],
    ['idx_campaigns_creator', 'campaigns(creator_id)'],
    ['idx_signatures_campaign', 'signatures(campaign_id)'],
    ['idx_signatures_user', 'signatures(user_id)'],
    ['idx_campaign_views_campaign', 'campaign_views(campaign_id)'],
    ['idx_campaign_shares_campaign', 'campaign_shares(campaign_id)'],
    ['idx_notifications_user', 'notifications(user_id, is_read)'],
    ['idx_campaign_followers_campaign', 'campaign_followers(campaign_id)'],
    ['idx_campaign_followers_user', 'campaign_followers(user_id)'],
    ['idx_status_history_campaign', 'campaign_status_history(campaign_id)'],
    ['idx_campaign_evidence_campaign', 'campaign_evidence(campaign_id)'],
    ['idx_campaign_reports_campaign', 'campaign_reports(campaign_id)'],
  ];

  for (const [name, cols] of indexes) {
    await run(`index: ${name}`, `CREATE INDEX IF NOT EXISTS ${name} ON ${cols}`);
  }

  // ─── SEED: standard_categories ───────────────────────────────────────────────

  const cats = [
    ['Tüketici Koruma', 'Tüketici hakları ve koruma standartları'],
    ['Çalışma Standartları', 'İşçi hakları ve çalışma koşulları'],
    ['Çevre Standartları', 'Çevresel sürdürülebilirlik ve koruma'],
    ['Veri Gizliliği', 'Kişisel veri koruma ve gizlilik'],
    ['Kurumsal Şeffaflık', 'Kurumsal hesap verebilirlik ve şeffaflık'],
    ['İnsan Hakları', 'Temel insan hakları standartları'],
  ];
  for (const [name, desc] of cats) {
    await run(`seed category: ${name}`, `
      INSERT INTO standard_categories (name, description)
      SELECT '${name.replace(/'/g, "''")}', '${desc.replace(/'/g, "''")}'
      WHERE NOT EXISTS (SELECT 1 FROM standard_categories WHERE name = '${name.replace(/'/g, "''")}')
    `);
  }

  console.log('\n✅ Migration tamamlandı.');
  await pool.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
