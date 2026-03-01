# V1 REFACTOR PLANI - BUDAMA OPERASYONU

## 🎯 HEDEF
Platformu odaklanmış, ciddi bir kampanya/denetim aracına dönüştürmek.
Sosyal medya katmanını, gamification'ı ve dağıtıcı özellikleri kaldırmak.

---

## 🔥 SİLİNECEK DOSYALAR

### BLOK 3: Meclis Gündemleri (Tamamı)
**Backend:**
- `src/services/parliamentAgendaService.ts`
- `src/controllers/parliamentAgendaController.ts`
- `src/routes/parliamentAgendaRoutes.ts`
- `seed-parliament-agendas.js`
- `add-parliament-agenda-tables.sql`

**Frontend:**
- `app/parliament-agendas/` (tüm klasör)

**Tablolar:**
- parliament_agendas
- public_opinion_votes
- agenda_comments
- agenda_followers

---

### BLOK 4: Topluluk Merkezi (Tamamı)
**Backend:**
- `src/services/communityService.ts`
- `src/services/pollService.ts`
- `src/controllers/communityController.ts`
- `src/controllers/pollController.ts`
- `src/routes/communityRoutes.ts`
- `src/routes/pollRoutes.ts`
- `seed-community.js`
- `seed-community.ts`
- `seed-polls.ts`
- `seed-success-stories.ts`

**Frontend:**
- `app/community/` (tüm klasör)

**Tablolar:**
- community_posts
- post_likes
- post_comments
- community_polls
- poll_votes
- success_stories

---

### BLOK 5: Avukat Ağı (Tamamı)
**Backend:**
- `src/services/lawyerService.ts`
- `src/services/legalApplicationService.ts`
- `src/controllers/lawyerController.ts`
- `src/controllers/legalApplicationController.ts`
- `src/routes/lawyerRoutes.ts`
- `src/routes/legalApplicationRoutes.ts`
- `add-lawyers-table.js`
- `add-legal-applications-table.js`
- `add-lawyer-profile.js`

**Frontend:**
- `app/lawyers/` (tüm klasör)

**Tablolar:**
- lawyers
- legal_applications

---

### BLOK 6: İtibar & Liderlik (Tamamı)
**Backend:**
- `src/services/reputationService.ts`
- `src/controllers/reputationController.ts`
- `src/routes/reputationRoutes.ts`
- `src/services/badgeService.ts`
- `src/controllers/badgeController.ts`
- `src/routes/badgeRoutes.ts`

**Frontend:**
- `app/leaderboard/` (tüm klasör)
- `components/ReputationBadge.tsx`

**Tablolar:**
- reputation_history
- badges (eğer varsa)

---

### BLOK 10: İstatistikler (Grafik Sayfaları)
**Frontend:**
- `app/stats/` (tüm klasör)

---

### BLOK 12: Çok Dilli Destek
**Frontend:**
- `lib/language-context.tsx`

---

### BLOK 13: Tema Sistemi
**Frontend:**
- `lib/theme-context.tsx`

---

### Telefon Doğrulama (BLOK 1'den)
**Backend:**
- `src/services/phoneVerificationService.ts`
- `src/controllers/phoneVerificationController.ts`
- `src/routes/phoneVerificationRoutes.ts`
- `add-phone-verification-table.js` (varsa)

**Frontend:**
- `components/PhoneVerificationModal.tsx`
- `components/PhoneVerificationRequiredModal.tsx`

**Tablolar:**
- phone_verifications

---

### Kampanya Özellikleri (BLOK 2'den Çıkarılacaklar)
**Backend:**
- `src/services/campaignFollowerService.ts`
- `src/controllers/campaignFollowerController.ts`
- `src/routes/campaignFollowerRoutes.ts`
- `add-campaign-followers-table.js`
- `src/routes/shareRoutes.ts`
- `src/controllers/shareController.ts`
- `add-share-clicks-table.js`
- `src/routes/commentRoutes.ts`
- `src/controllers/commentController.ts`

**Frontend:**
- `components/ShareStatistics.tsx`

**Tablolar:**
- campaign_followers
- share_clicks
- comments

---

### Fingerprint & Rate Limiting (BLOK 1'den)
**Backend:**
- `src/services/antiBotService.ts`
- `add-anti-bot-tables.sql`
- `add-anti-bot-tables.ts`

**Tablolar:**
- device_fingerprints
- rate_limits (basit rate limiting kalabilir)

---

### Email History (BLOK 14'ten)
**Tablolar:**
- email_history

---

### Notification Preferences (BLOK 7'den)
**Backend:**
- `src/services/notificationPreferencesService.ts`
- `src/controllers/notificationPreferencesController.ts`
- `src/routes/notificationPreferencesRoutes.ts`
- `add-notification-preferences-table.js`

**Frontend:**
- `app/settings/notifications/` (tüm klasör)

**Tablolar:**
- notification_preferences

---

## ⚠️ DEĞİŞTİRİLECEK DOSYALAR

### Backend Routes Index
**Dosya:** `backend/src/routes/index.ts`
**Çıkarılacak route'lar:**
- parliamentAgendaRoutes
- communityRoutes
- pollRoutes
- lawyerRoutes
- legalApplicationRoutes
- reputationRoutes
- badgeRoutes
- campaignFollowerRoutes
- shareRoutes
- commentRoutes
- phoneVerificationRoutes
- notificationPreferencesRoutes

### Frontend Header
**Dosya:** `frontend/components/Header.tsx`
**Çıkarılacak linkler:**
- /community
- /community/polls
- /community/success
- /parliament-agendas
- /leaderboard
- /lawyers
- /lawyers/register
- /stats
- /settings/notifications
- Tema toggle
- Dil toggle

### Campaign Service
**Dosya:** `backend/src/services/campaignService.ts`
**Çıkarılacaklar:**
- ReputationService import ve kullanımı
- BadgeService import ve kullanımı
- Ülke/şehir filtreleme metodları
- getCountriesWithCampaigns()
- getCitiesWithCampaigns()

### Campaign Controller
**Dosya:** `backend/src/controllers/campaignController.ts`
**Çıkarılacaklar:**
- Ülke/şehir endpoint'leri

### Vote Service
**Dosya:** `backend/src/services/voteService.ts`
**Sadeleştirilecek:**
- Sadece "support" (destekliyorum) kalacak
- "neutral" ve "oppose" çıkacak

### Admin Service
**Dosya:** `backend/src/services/adminService.ts`
**Çıkarılacaklar:**
- ReputationService import ve kullanımı

### Campaign Approval Service
**Dosya:** `backend/src/services/campaignApprovalService.ts`
**Çıkarılacaklar:**
- ReputationService import ve kullanımı

### Frontend API
**Dosya:** `frontend/lib/api.ts`
**Çıkarılacak metodlar:**
- Community ile ilgili tüm metodlar
- Poll ile ilgili tüm metodlar
- Parliament agenda ile ilgili tüm metodlar
- Lawyer ile ilgili tüm metodlar
- Reputation ile ilgili tüm metodlar
- Phone verification ile ilgili tüm metodlar
- Share tracking ile ilgili tüm metodlar
- Comment ile ilgili tüm metodlar
- Campaign follower ile ilgili tüm metodlar

### Database Schema
**Dosya:** `backend/src/database/schema.sql`
**Çıkarılacak tablolar:**
- parliament_agendas
- public_opinion_votes
- agenda_comments
- agenda_followers
- community_posts
- post_likes
- post_comments
- community_polls
- poll_votes
- success_stories
- lawyers
- legal_applications
- reputation_history
- campaign_followers
- share_clicks
- comments
- phone_verifications
- device_fingerprints
- email_history
- notification_preferences

---

## ✅ V1'DE KALACAK ÇEKİRDEK

### Backend Services (Kalacak)
- authService.ts
- campaignService.ts (sadeleşmiş)
- signatureService.ts
- voteService.ts (sadeleşmiş - sadece support)
- campaignStatusService.ts
- organizationResponseService.ts
- pressReleaseService.ts
- notificationService.ts (minimal)
- adminService.ts (sadeleşmiş)
- campaignApprovalService.ts (sadeleşmiş)
- uploadService.ts
- emailService.ts (sadece verification & password reset)

### Frontend Pages (Kalacak)
- app/page.tsx (ana sayfa)
- app/auth/* (login, register, verify-email)
- app/campaigns/* (list, detail, new)
- app/admin/* (admin panel)
- app/profile/* (profil sayfası - sadeleşmiş)
- app/notifications/* (minimal bildirimler)

### Components (Kalacak)
- Header.tsx (sadeleşmiş)
- Toast.tsx
- CampaignStatusUpdates.tsx
- EmptyState.tsx
- LoadingSkeleton.tsx

### Database Tables (Kalacak)
- users
- campaigns
- signatures
- votes (sadece support)
- status_updates
- organization_responses
- press_releases
- notifications (minimal)
- campaign_approvals
- reports
- user_bans

---

## 📋 UYGULAMA SIRASI

1. ✅ Backend route'larını kaldır (index.ts'den)
2. ✅ Backend controller dosyalarını sil
3. ✅ Backend service dosyalarını sil
4. ✅ Backend route dosyalarını sil
5. ✅ Frontend sayfalarını sil
6. ✅ Frontend component'leri sil
7. ✅ Frontend context'leri sil
8. ✅ Header'ı güncelle
9. ✅ API client'ı güncelle
10. ✅ Campaign service'i sadeleştir
11. ✅ Vote service'i sadeleştir
12. ✅ Admin service'i sadeleştir
13. ✅ Database migration scripti oluştur (tabloları sil)
14. ✅ Test ve doğrulama

---

## 🎯 SONUÇ

**Silinecek:**
- ~40 dosya
- ~15 tablo
- ~60-70 endpoint

**Kalan:**
- Odaklanmış kampanya sistemi
- Admin onay mekanizması
- Kurum yanıt sistemi
- Minimal bildirimler
- Temiz, ciddi bir platform
