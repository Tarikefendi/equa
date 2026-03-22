CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    is_verified INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    country TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    creator_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('company', 'brand', 'government')),
    target_email TEXT,
    category TEXT NOT NULL,
    tags TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'active', 'concluded')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    goals TEXT,
    evidence TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    vote_choice TEXT NOT NULL,
    vote_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, user_id)
);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verification Tokens Table
CREATE TABLE IF NOT EXISTS verification_tokens (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    parent_id TEXT,
    content TEXT NOT NULL,
    is_edited INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- User Roles & Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin')),
    permission TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission)
);

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Uploads Table
CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    reporter_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Campaign Milestones Table
CREATE TABLE IF NOT EXISTS campaign_milestones (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Campaign Status Updates Table
CREATE TABLE IF NOT EXISTS campaign_status_updates (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status_type TEXT NOT NULL CHECK (status_type IN ('in_progress', 'legal_action', 'court_filed', 'hearing_scheduled', 'won', 'partially_won', 'rejected', 'settled', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    documents TEXT,
    is_milestone INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Campaign Followers Table
CREATE TABLE IF NOT EXISTS campaign_followers (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, user_id)
);

-- Share Clicks Table
CREATE TABLE IF NOT EXISTS share_clicks (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    referrer TEXT,
    ip_address TEXT,
    user_agent TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id TEXT PRIMARY KEY,
    email_notifications INTEGER DEFAULT 1,
    campaign_updates INTEGER DEFAULT 1,
    comment_replies INTEGER DEFAULT 1,
    vote_notifications INTEGER DEFAULT 0,
    badge_notifications INTEGER DEFAULT 1,
    report_updates INTEGER DEFAULT 1,
    system_announcements INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Lawyers Table
CREATE TABLE IF NOT EXISTS lawyers (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    bar_number TEXT NOT NULL,
    specializations TEXT NOT NULL,
    experience_years INTEGER,
    bio TEXT,
    phone TEXT,
    city TEXT,
    is_verified INTEGER DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Lawyer Campaign Matches Table
CREATE TABLE IF NOT EXISTS lawyer_campaign_matches (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    lawyer_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- User Bans Table
CREATE TABLE IF NOT EXISTS user_bans (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    banned_by TEXT NOT NULL,
    banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unbanned_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_votes_campaign ON votes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_campaign ON comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_uploads_entity ON uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_milestones_campaign ON campaign_milestones(campaign_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_campaign ON campaign_status_updates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_created ON campaign_status_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_followers_campaign ON campaign_followers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_followers_user ON campaign_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_followers_created ON campaign_followers(created_at);
CREATE INDEX IF NOT EXISTS idx_share_clicks_campaign ON share_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_share_clicks_platform ON share_clicks(platform);
CREATE INDEX IF NOT EXISTS idx_share_clicks_date ON share_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_lawyers_user ON lawyers(user_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_city ON lawyers(city);
CREATE INDEX IF NOT EXISTS idx_lawyer_matches_lawyer ON lawyer_campaign_matches(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_matches_campaign ON lawyer_campaign_matches(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_date ON user_bans(banned_at);

-- Signatures Table (for petition-style campaigns)
CREATE TABLE IF NOT EXISTS signatures (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT,
    is_anonymous INTEGER DEFAULT 0,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_signatures_campaign ON signatures(campaign_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_created ON signatures(created_at);




-- Email History Table
CREATE TABLE IF NOT EXISTS email_history (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('campaign_notification', 'manual_send', 'milestone')),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    signature_count INTEGER DEFAULT 0,
    sent_by TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_history_campaign ON email_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);


-- Organization Responses Table
CREATE TABLE IF NOT EXISTS organization_responses (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    organization_email TEXT NOT NULL,
    response_text TEXT NOT NULL,
    response_type TEXT NOT NULL CHECK (response_type IN ('official', 'statement', 'action_taken')),
    contact_person TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_organization_responses_campaign ON organization_responses(campaign_id);
CREATE INDEX IF NOT EXISTS idx_organization_responses_verified ON organization_responses(is_verified);


-- Legal Applications Table
CREATE TABLE IF NOT EXISTS legal_applications (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    application_type TEXT NOT NULL CHECK (application_type IN ('echr', 'un_human_rights', 'icc', 'national_court', 'other')),
    application_status TEXT DEFAULT 'draft' CHECK (application_status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')),
    application_data TEXT NOT NULL,
    documents TEXT,
    submission_date TIMESTAMP,
    case_number TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_legal_applications_campaign ON legal_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_legal_applications_user ON legal_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_applications_status ON legal_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_legal_applications_type ON legal_applications(application_type);


-- ============================================
-- COMMUNITY HUB TABLES (Campaign-Focused Social)
-- ============================================

-- Community Posts Table (Campaign-focused discussions)
CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL, -- REQUIRED: Every post must be linked to a campaign
    content TEXT NOT NULL CHECK (length(content) <= 500), -- Max 500 characters
    type TEXT DEFAULT 'post' CHECK (type IN ('post', 'update', 'question')),
    parent_id TEXT, -- For replies
    hashtags TEXT, -- JSON array of hashtags
    is_pinned INTEGER DEFAULT 0,
    is_edited INTEGER DEFAULT 0,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_campaign ON community_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_parent ON community_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- Post Bookmarks Table
CREATE TABLE IF NOT EXISTS post_bookmarks (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post ON post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON post_bookmarks(user_id);

-- Hashtags Table
CREATE TABLE IF NOT EXISTS hashtags (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    name TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    trending_score REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage ON hashtags(usage_count DESC);

-- User Follows Table
CREATE TABLE IF NOT EXISTS user_follows (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Polls Table (Campaign-focused polls)
CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    user_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL, -- REQUIRED: Every poll must be linked to a campaign
    question TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'single' CHECK (type IN ('single', 'multiple')),
    duration INTEGER DEFAULT 7, -- days
    is_anonymous INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    total_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_polls_user ON polls(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_campaign ON polls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_ends_at ON polls(ends_at);

-- Poll Options Table
CREATE TABLE IF NOT EXISTS poll_options (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    poll_id TEXT NOT NULL,
    option_text TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);

-- Poll Votes Table
CREATE TABLE IF NOT EXISTS poll_votes (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    poll_id TEXT NOT NULL,
    option_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(poll_id, user_id, option_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option ON poll_votes(option_id);

-- Success Stories Table
CREATE TABLE IF NOT EXISTS success_stories (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    full_story TEXT,
    impact_metrics TEXT, -- JSON: {participants, duration, outcome}
    media_coverage TEXT, -- JSON array of media links
    user_testimonials TEXT, -- JSON array
    featured_image TEXT,
    is_featured INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_success_stories_campaign ON success_stories(campaign_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_success_stories_published ON success_stories(published_at DESC);

-- Story Reactions Table
CREATE TABLE IF NOT EXISTS story_reactions (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
    story_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('inspiring', 'helpful', 'amazing')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES success_stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_reactions_story ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user ON story_reactions(user_id);
