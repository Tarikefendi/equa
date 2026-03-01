-- V1 CLEANUP MIGRATION
-- Bu script gereksiz tabloları ve kolonları kaldırır

-- ========================================
-- TAMAMEN SİLİNECEK TABLOLAR
-- ========================================

-- BLOK 3: Meclis Gündemleri
DROP TABLE IF EXISTS agenda_followers;
DROP TABLE IF EXISTS agenda_comments;
DROP TABLE IF EXISTS public_opinion_votes;
DROP TABLE IF EXISTS parliament_agendas;

-- BLOK 4: Topluluk Merkezi
DROP TABLE IF EXISTS success_stories;
DROP TABLE IF EXISTS poll_votes;
DROP TABLE IF EXISTS community_polls;
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS community_posts;

-- BLOK 5: Avukat Ağı
DROP TABLE IF EXISTS legal_applications;
DROP TABLE IF EXISTS lawyers;

-- BLOK 6: İtibar & Liderlik
DROP TABLE IF EXISTS reputation_history;
DROP TABLE IF EXISTS badges;

-- Telefon Doğrulama
DROP TABLE IF EXISTS phone_verifications;

-- Kampanya Özellikleri (Çıkarılanlar)
DROP TABLE IF EXISTS campaign_followers;
DROP TABLE IF EXISTS share_clicks;
DROP TABLE IF EXISTS comments;

-- Fingerprint & Anti-Bot
DROP TABLE IF EXISTS device_fingerprints;
DROP TABLE IF EXISTS rate_limits;

-- Email History
DROP TABLE IF EXISTS email_history;

-- Notification Preferences
DROP TABLE IF EXISTS notification_preferences;

-- ========================================
-- KAMPANYA TABLOSUNDAN ÇIKARILACAK KOLONLAR
-- ========================================

-- Ülke/Şehir filtreleme kolonları
ALTER TABLE campaigns DROP COLUMN IF EXISTS country;
ALTER TABLE campaigns DROP COLUMN IF EXISTS city;

-- ========================================
-- VOTES TABLOSUNU SADELEŞTİR
-- ========================================

-- Sadece 'support' kalacak, 'neutral' ve 'oppose' silinecek
-- Önce mevcut vote_type'ları kontrol et
DELETE FROM votes WHERE vote_type != 'support';

-- ========================================
-- TEMİZLİK TAMAMLANDI
-- ========================================

SELECT 'V1 Cleanup Migration Completed!' as message;
