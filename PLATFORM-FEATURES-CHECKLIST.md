# PLATFORM ÖZELLİKLERİ - KARAR LİSTESİ

Bu liste, platformdaki tüm özellikleri blok blok gösterir. Her bloğun yanına kararını işaretleyebilirsin:
- ✅ GÜÇLENDIR: Bu özellik kalacak ve geliştirilecek
- ❌ İPTAL: Bu özellik kaldırılacak
- ⚠️ SADELEŞTIR: Bu özellik basitleştirilecek

---

## 🔐 BLOK 1: KULLANICI YÖNETİMİ & GÜVENLİK
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Kayıt sistemi (email + şifre)
- [ ] Giriş sistemi (JWT token)
- [ ] Email doğrulama
- [ ] Telefon doğrulama (SMS)
- [ ] Şifre sıfırlama
- [ ] reCAPTCHA entegrasyonu
- [ ] Anti-bot sistemi (fingerprint, rate limiting)
- [ ] Kullanıcı yasaklama sistemi

**Dosyalar:**
- Backend: `src/services/authService.ts`, `src/services/phoneVerificationService.ts`, `src/services/antiBotService.ts`
- Frontend: `app/auth/login`, `app/auth/register`, `app/auth/verify-email`
- Tablolar: `users`, `phone_verifications`, `device_fingerprints`, `rate_limits`, `user_bans`

**Notlar:**
- Güvenlik için kritik
- Telefon doğrulama maliyetli olabilir
- Anti-bot sistemi karmaşık

---

## 🎯 BLOK 2: KAMPANYA SİSTEMİ (ANA ÖZELLIK)
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Kampanya oluşturma
- [ ] Kampanya listeleme (filtreleme, arama)
- [ ] Kampanya detay sayfası
- [ ] İmza toplama sistemi
- [ ] Oylama sistemi (Destekliyorum/Kararsızım/Desteklemiyorum)
- [ ] Yorum sistemi
- [ ] Kampanya takip etme
- [ ] Kampanya paylaşma & istatistikleri
- [ ] Ülke/Şehir bazlı filtreleme
- [ ] Kampanya onay sistemi (admin)
- [ ] Kampanya kategorileri

**Dosyalar:**
- Backend: `src/services/campaignService.ts`, `src/services/signatureService.ts`, `src/services/voteService.ts`
- Frontend: `app/campaigns/page.tsx`, `app/campaigns/[id]/page.tsx`, `app/campaigns/new/page.tsx`
- Tablolar: `campaigns`, `signatures`, `votes`, `comments`, `campaign_followers`, `share_clicks`

**Notlar:**
- Platformun temel özelliği
- En çok kullanılacak alan
- İmza toplama yasal süreçlerde önemli

---

## 🏛️ BLOK 3: MECLİS GÜNDEMLERİ (HALK NE DİYOR)
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Meclis gündemlerini listeleme
- [ ] Gündem detay sayfası
- [ ] Halkın oy vermesi (Destekliyorum/Karşıyım/Kararsızım)
- [ ] Yorum sistemi
- [ ] Bölgesel istatistikler
- [ ] Gündem takip etme
- [ ] Ülke bazlı filtreleme

**Dosyalar:**
- Backend: `src/services/parliamentAgendaService.ts`
- Frontend: `app/parliament-agendas/page.tsx`, `app/parliament-agendas/[id]/page.tsx`
- Tablolar: `parliament_agendas`, `public_opinion_votes`, `agenda_comments`, `agenda_followers`

**Notlar:**
- Demokratik katılım için güçlü özellik
- Manuel veri girişi gerekiyor (otomatik API yok)
- Güncel tutmak zor olabilir

---

## 👥 BLOK 4: TOPLULUK MERKEZİ
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Haber akışı (community posts)
- [ ] Post oluşturma (metin, resim, video)
- [ ] Beğeni & yorum sistemi
- [ ] Hashtag sistemi
- [ ] Anketler (community polls)
- [ ] Başarı hikayeleri
- [ ] Trending hashtags

**Dosyalar:**
- Backend: `src/services/communityService.ts`, `src/services/pollService.ts`
- Frontend: `app/community/page.tsx`, `app/community/post/[id]`, `app/community/polls`, `app/community/success`
- Tablolar: `community_posts`, `post_likes`, `post_comments`, `community_polls`, `poll_votes`, `success_stories`

**Notlar:**
- Sosyal medya benzeri özellik
- Moderasyon gerektirir
- Kampanyalardan bağımsız çalışıyor

---

## ⚖️ BLOK 5: AVUKAT AĞI
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Avukat kayıt sistemi
- [ ] Avukat profilleri
- [ ] Avukat listeleme (uzmanlık, şehir filtreleme)
- [ ] Yasal başvuru sistemi
- [ ] Avukat-kampanya eşleştirme

**Dosyalar:**
- Backend: `src/services/lawyerService.ts`, `src/services/legalApplicationService.ts`
- Frontend: `app/lawyers/page.tsx`, `app/lawyers/register/page.tsx`
- Tablolar: `lawyers`, `legal_applications`

**Notlar:**
- Niş bir özellik
- Yasal süreçler için faydalı
- Az kullanılabilir

---

## 🏆 BLOK 6: İTİBAR & LIDERLIK SİSTEMİ
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] İtibar puanı hesaplama
- [ ] Rozet sistemi (Bronze, Silver, Gold, Platinum, Diamond)
- [ ] Liderlik tablosu
- [ ] Kullanıcı sıralaması
- [ ] İtibar geçmişi

**Dosyalar:**
- Backend: `src/services/reputationService.ts`
- Frontend: `app/leaderboard/page.tsx`, `components/ReputationBadge.tsx`
- Tablolar: `reputation_history`

**Notlar:**
- Gamification özelliği
- Kullanıcı motivasyonu için iyi
- Karmaşık hesaplama

---

## 🔔 BLOK 7: BİLDİRİM SİSTEMİ
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Bildirim oluşturma
- [ ] Bildirim listeleme
- [ ] Okundu işaretleme
- [ ] Bildirim tercihleri (email, push)
- [ ] Bildirim kategorileri

**Dosyalar:**
- Backend: `src/services/notificationService.ts`, `src/services/notificationPreferencesService.ts`
- Frontend: `app/notifications/page.tsx`, `app/settings/notifications/page.tsx`
- Tablolar: `notifications`, `notification_preferences`

**Notlar:**
- Kullanıcı etkileşimi için önemli
- Email gönderimi maliyetli olabilir
- Push notification karmaşık

---

## 👤 BLOK 8: PROFİL & AYARLAR
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Profil sayfası
- [ ] Profil düzenleme
- [ ] Avatar yükleme
- [ ] Kullanıcı istatistikleri
- [ ] Aktivite geçmişi
- [ ] Bildirim ayarları
- [ ] Tema değiştirme (light/dark)
- [ ] Dil değiştirme

**Dosyalar:**
- Backend: `src/services/userService.ts`
- Frontend: `app/profile/page.tsx`, `app/settings/notifications/page.tsx`
- Context: `lib/theme-context.tsx`, `lib/language-context.tsx`

**Notlar:**
- Temel kullanıcı özellikleri
- Tema ve dil sistemi çalışıyor

---

## 🛡️ BLOK 9: ADMIN PANELİ
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Admin dashboard
- [ ] Kampanya onaylama/reddetme
- [ ] Kullanıcı yönetimi
- [ ] Kullanıcı yasaklama
- [ ] İçerik moderasyonu
- [ ] Şikayet yönetimi
- [ ] İstatistikler

**Dosyalar:**
- Backend: `src/services/adminService.ts`, `src/services/campaignApprovalService.ts`
- Frontend: `app/admin/page.tsx`
- Tablolar: `campaign_approvals`, `reports`

**Notlar:**
- Platform yönetimi için kritik
- Moderasyon gerekli
- Güvenlik önemli

---

## 📊 BLOK 10: İSTATİSTİKLER & RAPORLAMA
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Platform istatistikleri
- [ ] Kampanya istatistikleri
- [ ] Kullanıcı istatistikleri
- [ ] Paylaşım istatistikleri
- [ ] Grafik ve görselleştirme

**Dosyalar:**
- Backend: `src/services/statisticsService.ts`
- Frontend: `app/stats/page.tsx`, `components/ShareStatistics.tsx`
- Tablolar: `share_clicks`

**Notlar:**
- Veri analizi için önemli
- Görselleştirme geliştirilebilir

---

## 📝 BLOK 11: KAMPANYA DURUM GÜNCELLEMELERİ
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Durum güncellemesi ekleme
- [ ] Güncellemeleri listeleme
- [ ] Zaman çizelgesi görünümü
- [ ] Organizasyon yanıtları
- [ ] Basın açıklamaları

**Dosyalar:**
- Backend: `src/services/campaignStatusService.ts`, `src/services/organizationResponseService.ts`, `src/services/pressReleaseService.ts`
- Frontend: `components/CampaignStatusUpdates.tsx`
- Tablolar: `status_updates`, `organization_responses`, `press_releases`

**Notlar:**
- Kampanya şeffaflığı için iyi
- Manuel güncelleme gerekiyor

---

## 🌍 BLOK 12: ÇOK DİLLİ DESTEK
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Türkçe/İngilizce dil desteği
- [ ] Dil değiştirme
- [ ] Çeviri sistemi

**Dosyalar:**
- Frontend: `lib/language-context.tsx`

**Notlar:**
- Uluslararası kullanım için gerekli
- Çeviriler eksik olabilir

---

## 🎨 BLOK 13: TEMA SİSTEMİ
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Light/Dark mode
- [ ] Tema değiştirme
- [ ] Otomatik tema (sistem tercihi)

**Dosyalar:**
- Frontend: `lib/theme-context.tsx`, `app/globals.css`

**Notlar:**
- Kullanıcı deneyimi için iyi
- Çalışıyor

---

## 📧 BLOK 14: EMAIL SİSTEMİ
**Durum:** [ ] GÜÇLENDIR / [ ] İPTAL / [ ] SADELEŞTIR

**Alt Özellikler:**
- [ ] Email doğrulama maili
- [ ] Şifre sıfırlama maili
- [ ] Bildirim mailleri
- [ ] Email geçmişi

**Dosyalar:**
- Backend: `src/services/emailService.ts`
- Tablolar: `email_history`

**Notlar:**
- Şu anda simülasyon modunda (SMTP yok)
- Gerçek email için SMTP gerekli

---

## ÖZET İSTATİSTİKLER

**Toplam Blok Sayısı:** 14
**Toplam Tablo Sayısı:** 30+
**Toplam API Endpoint:** 130+
**Toplam Kod Satırı:** 15,000+

---

## KARAR SONRASI YAPILACAKLAR

1. ✅ GÜÇLENDIR işaretli bloklar:
   - Kod kalitesi artırılacak
   - Yeni özellikler eklenecek
   - UI/UX iyileştirilecek
   - Test coverage artırılacak

2. ❌ İPTAL işaretli bloklar:
   - Kodlar silinecek
   - Tablolar kaldırılacak
   - API endpoint'ler silinecek
   - Frontend sayfaları kaldırılacak

3. ⚠️ SADELEŞTIR işaretli bloklar:
   - Gereksiz özellikler çıkarılacak
   - Basitleştirilecek
   - Temel özellikler kalacak

---

## NOTLAR

- Her bloğun bağımlılıkları var (örn: Kampanya sistemi, kullanıcı yönetimine bağlı)
- Bazı bloklar birbirine entegre (örn: İtibar sistemi, kampanya sistemine bağlı)
- Kararları verirken bağımlılıkları göz önünde bulundur
