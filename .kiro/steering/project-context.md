# EQUA — Proje Context

## Proje Nedir?
Global bir sivil hesap verebilirlik platformu. Kullanıcılar kurumlara (şirket, marka, devlet kurumu) karşı kampanya açabiliyor, imza toplayabiliyor, kanıt ekleyebiliyor ve kurumların resmi yanıtlarını takip edebiliyor. Platform şeffaflık ve belgeleme odaklı — bir boykot listesi değil, denetim dosyası mantığıyla çalışıyor.

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Node.js + Express, TypeScript
- Database: PostgreSQL (host: localhost, port: 5432, db: boykot_db, user: postgres, password: 1627)
- Auth: JWT

## Ortam Bilgileri
- Backend: `http://localhost:5000`, API prefix: `/api/v1`
- Frontend: `http://localhost:3000`
- Backend başlatma: `backend/` klasöründe `npm run dev` veya `node src/server.js`
- Frontend başlatma: `frontend/` klasöründe `npm run dev`

## Test Kullanıcısı
- Email: `testlogin@example.com`
- Şifre: `12345678`
- Role: `admin`

## Kritik Teknik Kurallar
- Tailwind custom CSS değişkenleri (`bg-bg-primary`, `text-text-primary` vb.) çalışmıyor — inline style veya standart Tailwind sınıfları kullanılmalı
- Platform `signatures` tablosunu kullanıyor (`supports` değil)
- Durum değişikliği sonrası 10 dakika kilidi ve günlük limit korunmalı
- Her backend değişikliğinden sonra backend restart gerekiyor
- DB migration'lar `backend/` klasöründe ayrı `.js` dosyaları olarak tutuluyor (örn. `add-campaign-reports.js`)

## Proje Yapısı
```
backend/
  src/
    controllers/   # HTTP handler'lar
    services/      # İş mantığı
    routes/        # Express router'lar
    middleware/    # auth, roleCheck vb.
    types/         # TypeScript tipleri
  *.js             # Migration ve test scriptleri

frontend/
  app/             # Next.js App Router sayfaları
  components/      # Paylaşılan bileşenler
  lib/             # api.ts, auth-context, hooks
  types/           # Frontend tipleri
```

## Tamamlanan Özellikler

### Kullanıcı Sistemi
- Kayıt / giriş (JWT)
- Email doğrulama
- Profil (public/private)
- Reputation sistemi
- Anti-bot: reCAPTCHA + device fingerprint
- Şifre Sıfırlama (Forgot Password):
  - `POST /auth/forgot-password` — email alır, token üretir, Mailtrap SMTP ile gerçek email gönderir
  - `POST /auth/reset-password` — token + yeni şifre alır, `verificationService.resetPassword()` ile günceller
  - `frontend/app/auth/forgot-password/page.tsx` — email formu, her zaman başarı mesajı gösterir (email enumeration koruması)
  - `frontend/app/auth/reset-password/page.tsx` — token URL param'dan okunur, yeni şifre formu, başarıda 2.5sn sonra login'e yönlendirir
  - Login sayfasında "Şifremi unuttum" linki mevcut
  - `backend/src/config/email.ts` — nodemailer transporter, Mailtrap Sandbox SMTP (`sandbox.smtp.mailtrap.io:2525`)
  - `.env` SMTP değişkenleri: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FRONTEND_URL`
  - Token expire sorunu düzeltildi: `new Date().setHours()` yerine `NOW() + INTERVAL` kullanılıyor (timezone bug fix)

### Kampanya Sistemi
- Kampanya oluşturma (v2 form: demanded_action, standard_reference, response_deadline vb.)
- Admin onay akışı (pending → approved)
- Durum yönetimi: `active`, `response_received`, `resolved`, `closed_unresolved`, `archived`
- 10 dakika durum kilidi + günlük değişim limiti
- Arşivleme + 24 saat geri alma
- Durum geçmişi (`campaign_status_history` tablosu)
- View tracking (30 dk cooldown, `campaign_views` tablosu)
- Kampanya takip sistemi (follow/unfollow + bildirim)
- Kampanya şikayet sistemi (report/abuse)
- Kampanya paylaşım takibi (share tracking): WhatsApp, X, Telegram, copy_link — platform bazlı analytics, `share_count` ve `campaign_shares` tablosu
- Duplicate kampanya tespiti: kampanya oluşturma formunda başlık yazılırken benzer kampanyalar öneriliyor (3+ karakter, 400ms debounce, max 5 sonuç, destek sayısına göre sıralı)
- Trending kampanya sistemi: `GET /campaigns/trending` — `trending_score = (support_count * 3) + views + activity_bonus(50)` formülü ile dinamik hesaplama, son 24 saatte aktivite olan kampanyalara +50 bonus, top 20, `active`/`response_received` durumundakiler; frontend'de 🔥 Trend / 👍 En Desteklenen / 🕐 En Yeni sıralama sekmeleri, trending varsayılan
- Kurum yanıt süresi takibi (Response Deadline System):
  - Günlük cron job: `active` + `response_deadline_date` geçmiş + resmi yanıt yok → status `no_response`
  - Timeline'a otomatik sistem güncellemesi ekleniyor: "Kurum belirtilen süre içinde yanıt vermedi."
  - Kampanya takipçilerine bildirim gönderiliyor
  - **3 gün öncesi uyarı bildirimi**: `checkResponseDeadlines()` içinde deadline 3 gün kala `deadline_approaching` tipi bildirim gönderiliyor (günde 1 kez, duplicate koruması var)
  - Kampanya oluşturma formunda yanıt süresi seçici: 30 gün (varsayılan) / 45 gün / 60 gün / Belirtme — `response_deadline_days` submit payload'a eklendi
  - Kampanya detay sayfasında deadline countdown bloğu: `status=active` iken "⏳ X gün kaldı" (3 gün kala kırmızı), `status=no_response` iken "⚠️ Kurum yanıt vermedi" uyarısı
  - `campaigns_status_check` constraint'e `no_response` eklendi (`add-no-response-status.js`)
  - `CampaignClosureService.checkResponseDeadlines()` + server.ts'te günlük cron job
  - `add-deadline-default.js` migration — mevcut aktif kampanyalara 30 gün varsayılan deadline set eder
- Kampanya kapatma sistemi:
  - `POST /campaigns/:id/resolve` — kampanya sahibi veya admin, status → `resolved`, `resolution_reason` kaydedilir
  - `POST /campaigns/:id/close` — sadece admin, status → `closed`
  - Otomatik arşivleme: sunucu başlangıcında ve her 24 saatte bir çalışan job, `active`/`response_received` + `last_activity_at < NOW() - 180 days` → `archived`
  - `last_activity_at` imza, güncelleme ve kanıt eklemelerinde otomatik güncelleniyor
  - `campaigns` tablosuna `last_activity_at` ve `resolution_reason` kolonları eklendi (`add-campaign-closure.js`)
  - `campaigns_status_check` constraint'e `closed` ve `closed_unresolved` değerleri eklendi (`add-closed-status.js`)
- Campaign Victory Moment:
  - Kampanya `resolved` olduğunda `victory_at = NOW()`, `victory_support_count = imza sayısı` otomatik set ediliyor
  - `GET /campaigns/:id/victory` — `{ is_victory, victory_at, supporters }` döner
  - Kampanya sayfasında resolved kampanyalarda yeşil gradient victory banner gösteriliyor: "🎉 Kampanya Zaferi", destekçi sayısı, çözüm tarihi
  - `campaigns` tablosuna `victory_at TIMESTAMP`, `victory_support_count INTEGER` eklendi (`add-campaign-victory.js`)
- Campaign Impact Metrics:
  - `GET /campaigns/:id/impact` endpoint'i — `support_count`, `view_count`, `share_count`, `conversion_rate`, `response_received`, `campaign_status` döner
  - `conversion_rate = (support_count / view_count) * 100`, view_count=0 ise 0
  - `CampaignImpactService.getImpactMetrics(campaignId)` — `backend/src/services/CampaignImpactService.ts`
  - `CampaignImpactCard` component — `frontend/components/CampaignImpactCard.tsx`
  - Kampanya sayfası sidebar'ında "Kampanya Etkisi" kartı olarak gösteriliyor
- Milestone Sistemi:
  - Eşikler: 10 / 50 / 100 / 500 / 1.000 / 5.000 / 10.000 destekçi
  - Etiketler: "İlk Adım", "Dikkat Çekiyor", "Yükselen Kampanya", "Yüksek Baskı", "Viral", "Kritik Kitle", "Tarihi Kampanya"
  - Her imza sonrası `MilestoneService.checkAndNotify()` çağrılır — eşik geçilince kampanya sahibi + tüm takipçilere `milestone_reached` bildirimi gönderilir
  - `GET /campaigns/:id/milestone` — `support_count`, `current_milestone`, `next_milestone`, `progress_to_next`, `all_milestones` döner
  - Kampanya sayfası hero section'da 🏆 milestone badge'i: "Yükselen Kampanya · Sonraki: 500 destek" formatında
  - `backend/src/services/milestoneService.ts`, `backend/src/controllers/milestoneController.ts`, `backend/src/routes/milestoneRoutes.ts`

- Campaign Momentum Indicators:
  - `GET /campaigns/:id/momentum` — `total_supporters`, `today_supporters`, `total_shares`, `today_shares` döner
  - `CampaignMomentumService.ts`: `getMomentum(campaignId)` — `signatures` ve `campaign_shares` tablolarından `CURRENT_DATE` filtreli sorgular
  - Kampanya sayfasında destek sayısının altında yeşil "+X bugün" ve mavi "+X paylaşım" badge'leri gösteriliyor (sadece bugün aktivite varsa)
- Dynamic Activity Feed (Son Destekleyenler):
  - Kampanya sayfası sağ sidebar'ında "Son Destekleyenler" bölümü — son 8 imza gösteriliyor
  - Her satır: avatar dairesi (anonim için "?"), kullanıcı adı, mesaj (varsa, truncated), "X dk önce" / "X sa önce" / "X gün önce" formatında zaman
  - Son 1 saat içindeki destekler yeşil avatar + yeşil zaman rengiyle vurgulanıyor
  - 8'den fazla imza varsa "ve X kişi daha" footer notu
  - Yeni tablo/endpoint gerekmedi — mevcut `GET /campaigns/:id/signatures` kullanıldı
- Homepage Urgency Sections:
  - "Yanıt Süresi Doluyor" section: `response_deadline_date` 7 gün içinde olan aktif kampanyalar, sarı border, gün sayacı badge'i
  - "Kurumun Görmezden Geldiği" section: `status = 'no_response'` kampanyalar, kırmızı border, "Yanıt Yok" badge
  - Her iki section da kampanya yoksa gizleniyor
  - Mevcut `GET /campaigns` endpoint'i kullanıldı, yeni backend değişikliği gerekmedi
- Institution Pressure Enhancements (Entity Sayfası):
  - `metrics.no_response_count > 0` ise sayfanın üstünde kırmızı uyarı banner: "X kampanya yanıtsız kaldı"
  - Kampanya listesi `no_response` statuslular önce gelecek şekilde client-side sıralandı
  - Mevcut `entity_metrics` tablosu ve `GET /entities/:slug/metrics` endpoint'i kullanıldı
- Campaign Detail Page UI Refactor:
  - Hero section: başlık, hedef kurum (inline), şeffaflık badge, destek sayısı + momentum badge'leri, büyük "Kampanyayı Destekle" CTA
  - 3 tab sistemi: `[Genel]` (talep + özet + standart), `[Kanıtlar]` (liste + ekleme formu), `[Zaman Akışı]` (birleşik timeline)
  - Zaman Akışı tab'ı: `campaign_updates` + `campaign_status_history` tek timeline'da birleştirildi, DESC sıralı, filtreli (Tümü / Güncellemeler / Durum / Resmi Yanıt)
  - Sağ sidebar: "Kurum Profili" kartı (şeffaflık skoru + yanıt sicili + kurum linki), takip butonu, owner kontrolleri (durum değiştirme + soruşturma toggle), son destekleyenler
  - Tüm inline style, Tailwind custom variable yok
- Campaign Page Conversion Optimization:
  - Sticky support bar: sayfanın altında sabit, destekçi sayısı + bugün artışı + "Destek Ver" butonu — arşivlenmiş kampanyalarda gizleniyor
  - Destek butonu yeniden tasarlandı: pill şekli, gradient arka plan, gölge; desteklendikten sonra yeşil "✓ Destek Verildi" + "Desteği geri çek" linki
  - Hero section momentum badge'leri 🔥 emojisi ile güçlendirildi
  - Zaman Akışı tab'ına "Bu kampanyada neler oldu?" subtitle eklendi
  - Duplicate bottom support block kaldırıldı
- Viral Growth Features (Campaign Detail Page):
  - Share Card Modal: destek verdikten sonra otomatik açılan modal — kampanya başlığı, destekçi sayısı, paylaşım butonları (WhatsApp/X/Telegram/Link), "İlk destekçilerden birisin" badge (signatureCount < 10), "Şimdi değil" kapatma
  - Early Supporter Badge: signatureCount < 10 iken post-support nudge'da "🏅 İlk destekçilerden birisin" sarı banner, kapatılabilir
  - Goal Clarity: progress bar altında "X destekçiye ulaşırsak kurum kamuoyu baskısıyla yanıt vermek zorunda kalır" metni
  - Invite Mechanic: post-support paylaşım butonlarında WhatsApp/Telegram mesajı "Bu kampanyayı destekledim, sen de katıl:" prefix'i ile pre-filled
  - Live Activity Badge: momentum.today_supporters > 0 ise progress bar altında yeşil "Son 24 saatte +X destek" canlı badge
  - handleAddSignature: alert kaldırıldı, imza sonrası setShowShareCard(true) ile share card modal açılıyor
- Campaign Creation Form UX Simplification:
  - Form 3 kart bölümüne ayrıldı: "1. Temel Bilgiler" (zorunlu), "2. Kampanyayı Güçlendir" (opsiyonel badge), "3. Ek Detaylar" (ikincil)
  - Header: "Yeni Kampanya" / "2 dakikada kampanyanı başlat"
  - Kategori seçimi pill buton kartlarına dönüştürüldü
  - Standart seçimine "Emin değilsen boş bırakabilirsin" helper text eklendi
  - Kanıt bölümüne "İstersen şimdi ekle, sonra da ekleyebilirsin" helper text eklendi, zorunluluk kaldırıldı
  - CTA butonu "🚀 Kampanyayı Yayınla" olarak güncellendi, gradient tasarım
  - Görünürlük seçimi 3'lü kart grid'e dönüştürüldü
- Campaign Creation Conversion Optimization:
  - Sticky bottom CTA bar: scroll 300px sonra fade-in, required fields dolunca aktif (gradient), dolmadıkça gri + "Zorunlu alanları doldur" mesajı
  - Progress indicator: "1/3 Temel Bilgiler → 2/3 Güçlendir → 3/3 Ek Detaylar", scroll pozisyonuna göre dinamik
  - Auto-save draft: 3sn debounce ile localStorage'a kayıt, "Kaydedildi ✓" feedback, reload'da "Kaldığın yerden devam ediyorsun" banner + taslağı sil seçeneği
  - Inline validation: submit'te eksik alanlar kırmızı border + hata metni, section 1'e otomatik scroll
  - CTA microcopy: "Kampanya yayınlandıktan sonra düzenleyebilirsin"
- Campaign Creation Page — 3 Adımlı Step Form Yeniden Tasarımı:
  - `frontend/app/campaigns/new/page.tsx` tamamen yeniden yazıldı
  - Adım 1 (Temel Bilgiler): başlık input (benzer kampanya uyarısı, 400ms debounce), hedef kurum autocomplete dropdown + yeni kurum ekleme formu, kategori pill seçimi
  - Adım 2 (Detay ve Talep): sorun açıklaması textarea + talep textarea, helper text'ler
  - Adım 3 (Kanıtlar): link ekleme (Enter ile), dosya/görsel upload (drag & drop), eklenen öğe listesi
  - Önizle butonu → modal preview kartı (başlık, hedef, açıklama özeti) → Yayınla
  - Auto-save draft (localStorage, 2sn debounce), "Kaldığın yerden devam ediyorsun" banner
  - Inline validation (kırmızı border + hata metni, alert yok)
  - Emoji yok, gradient yok, solid butonlar (`#1F2A44` primary), tüm inline style
### Soruşturma Modu (Investigation Mode)
- Kampanya sahibi soruşturma modunu açıp kapatabilir
- Mod açıkken kampanya sayfasında "🔍 Soruşturma Kampanyası" badge'i gösterilir
- Soruşturma paneli: toplam/doğrulandı/inceleniyor/işaretlendi kanıt sayıları
- Sidebar'da owner için toggle butonu
- `campaigns.investigation_mode` kolonu (`add-investigation-mode.js`)
- `CampaignInvestigationService.ts`: toggleInvestigationMode, getInvestigationSummary
- `PATCH /campaigns/:id/investigation-mode` — sadece kampanya sahibi veya admin
- `GET /campaigns/:id/investigation-summary` — kanıt istatistikleri

### Kanıt Sistemi
- Yapılandırılmış kanıt ekleme (link, document, image)
- Kampanya sahibi onay/red akışı (pending → approved/rejected)
- Kanıt onaylandığında takipçilere bildirim
- Evidence Credibility Layer:
  - `credibility_type` alanı: `official_document`, `government_record`, `news_source`, `company_statement`, `academic_source`, `user_submission`
  - `flag_count` alanı: topluluk işaretleme sayacı, 3+ flag → status otomatik `flagged`
  - `evidence_flags` tablosu: kim hangi kanıtı işaretledi (unique constraint)
  - `EvidenceModerationService.ts`: approveEvidence, rejectEvidence, flagEvidence, getEvidenceSummary, getFlaggedEvidence
  - `EvidenceCredibilityBadge` component — renk kodlu badge'ler (yeşil=resmi belge, mavi=haber, gri=kullanıcı vb.)
  - Kampanya sayfasında kanıt özet kartı (total/verified/pending/flagged)
  - Kanıt ekleme formunda kaynak türü seçici
  - 🚩 Flag butonu: giriş yapmış kullanıcılar kanıtı işaretleyebilir
  - Admin paneli: `GET /admin/flagged-evidence` ile işaretlenmiş kanıtları inceleme
  - Kampanya sahibi otomatik onay: sahibin kendi kampanyasına eklediği kanıt direkt `approved`, `verification_source = 'campaign_owner'` — diğer kullanıcılar `pending` akışına devam eder
  - `verification_source` alanı: `campaign_owner` veya `pending_review` (`add-evidence-verification-source.js`)
  - Badge'de kampanya sahibi tarafından eklenen kanıtlarda "· kampanya sahibi" notu gösteriliyor

### Güncelleme Sistemi
- Kampanya güncellemeleri (genel, medya, resmi)
- Sabitleme (pin)
- Düzenleme + düzenleme geçmişi
- Resmi yanıt tipi (`official_response`) — özel UI ile gösteriliyor

### Kurum (Entity) Sistemi
- Kurum profil sayfaları (`/entities/[slug]`)
- Kurum takip sistemi (follow/unfollow + bildirim)
- Verified institution account: admin tarafından oluşturulan, sadece kendi kurumuna resmi yanıt yazabilen hesap
  - `users.entity_id` + `role = 'institution'`
  - `POST /admin/entities/:entityId/institution-account`
  - Resmi yanıt gelince kampanya otomatik `response_received` oluyor
- Institution Response Tracker (Kurum Yanıt Sicili):
  - `entity_metrics` tablosu: campaign_count, response_count, resolved_count, no_response_count, avg_response_time_days, response_rate (`add-entity-metrics.js`)
  - `EntityMetricsService`: tekil entity hesaplama, toplu `recalculateAll()`, slug'a göre fetch
  - `GET /entities/:slug/metrics` endpoint'i — `metrics_available: false` if campaign_count < 3
  - Günlük cron job: server.ts'te `recalculateAll()` her 24 saatte çalışır
  - Entity profil sayfasında "Yanıt Sicili" kartı
  - Kampanya sayfasında "Kurum Yanıt Sicili" yan kartı (sadece metrics_available = true ise)
  - Kampanya oluşturma formunda kurum seçilince yanıt sicili özeti gösteriliyor (yanıt oranı, ort. yanıt süresi, toplam kampanya)
- Institution Transparency Score (Kurum Şeffaflık Skoru):
  - `entity_transparency_metrics` tablosu: entity_id TEXT, total_campaigns, response_received, resolved_campaigns, ignored_campaigns, average_response_days, transparency_score (`add-entity-transparency-score.js`)
  - `EntityTransparencyService.ts`: `calculateEntityScore(entityId)`, `getScoreBySlug(slug)`, `recalculateAllEntities()`
  - Skor formülü: `(response_rate * 40) + (resolution_rate * 30) + (speed_score * 0.20) - (ignore_penalty * 10)`, 0-100 arası
  - `GET /entities/:slug/transparency-score` endpoint'i
  - Günlük cron job: server.ts'te `recalculateAllEntities()` her 24 saatte çalışır
  - Entity profil sayfasında "🔎 Şeffaflık Skoru" kartı (renk kodlu: yeşil ≥70, sarı ≥40, kırmızı <40)
  - Kampanya sayfasında sidebar'da küçük şeffaflık skoru kartı (entity_slug varsa)

### Bildirim Sistemi
- Kampanya takipçilerine: yeni güncelleme, kanıt onayı, resmi yanıt
- Kurum takipçilerine: yeni kampanya, güncelleme
- Kampanya sahibine: resmi yanıt geldiğinde
- Notifications Page Redesign:
  - `frontend/app/notifications/page.tsx` tamamen yeniden yazıldı
  - Header: "Bildirimler" başlık + "Son 24 saatte X yeni gelişme" yeşil stat + "Tümünü okundu işaretle" butonu
  - 5 filter tab: Tümü / Okunmamış (sayaçlı, kırmızı badge) / Desteklerim / Güncellemeler / Kurum Yanıtları
  - Tarih gruplandırması: Bugün / Dün / Bu Hafta / Daha Önce
  - `NotificationCard` bileşeni: tip bazlı renkli SVG ikon (42px), okunmamışlarda mavi tint arka plan + koyu başlık, "Yeni" badge, zaman
  - Tip konfigürasyonu: `organization_response` (mavi), `campaign_update` (mor), `campaign_approved` (yeşil), `campaign_rejected` (kırmızı), `milestone_reached` (amber), `new_signature` (açık mavi)
  - Her kartta "Detaya Git" butonu (kampanya linki varsa) + "Okundu işaretle" butonu
  - Hover: card elevation + translateY(-1px)
  - Skeleton loading: 4 kart
  - Empty state: tip bazlı mesaj + "Kampanyaları keşfet" CTA
  - `groupByDate()` ve `isTypeInFilter()` yardımcı fonksiyonları

### Standart Kütüphanesi
- `standard_categories` tablosu: 6 kategori (Tüketici Koruma, Çalışma Standartları, Çevre, Veri Gizliliği, Kurumsal Şeffaflık, İnsan Hakları)
- `standards` tablosu: 7 seed standart (AB Direktifi, ILO, GDPR, KVKK, Paris Anlaşması, BM İlkeleri, İHEB)
- `standard_suggestions` tablosu: kullanıcı önerileri, `suggested_by TEXT` (users.id UUID), `ai_confidence FLOAT`, `status` (pending/approved/rejected)
- `campaigns.standard_id` kolonu eklendi (`add-standards-library.js`)
- `StandardsService.ts`: getCategories, getStandards, suggestStandard, approveSuggestion (→ standards tablosuna ekler), rejectSuggestion
- Public endpoints: `GET /standards/categories`, `GET /standards`, `POST /standards/suggest`
- Admin endpoints: `GET /admin/standard-suggestions`, `PATCH /admin/standard-suggestions/:id`
- Kampanya oluşturma formunda kategori filtreli standart seçici + "Standart Öner" modal
- Admin panelinde "📚 Standartlar" tab'ı: öneri listesi, onayla/reddet butonları, AI güven skoru gösterimi

- User Profile Page Redesign:
  - Tüm Tailwind custom variable'lar kaldırıldı, saf inline style
  - Hero: avatar dairesi (initial-based, `#1F2A44`), büyük username, muted email, badge'ler (Doğrulanmış / Admin / puan)
  - Privacy toggle: smooth CSS transition, açıklama metni ("Aktif olduğunda katkıların anonim görünür")
  - 4'lü metrik grid: Kampanyam / İmzaladığım / Toplam Destek / İtibar Puanı (emphasized)
  - İtibar kartı: skor dairesi + breakdown chip'leri (+10 Kampanya, +3 Güncelleme, +5 Kanıt) + son aktiviteler log'u
  - Kampanya ve imza satırları: hover background + border, tüm satır tıklanabilir, status badge, anonim/açık etiketi
  - Kampanya/imza listelerinde `PAGE_SIZE=10` client-side pagination: "Daha Fazla Göster" / "Daha Az Göster" + X/toplam sayacı
  - Admin paneli linki: temiz kart, solid buton
  - Emoji yok, gradient yok

- Admin Dashboard Redesign:
  - Tüm Tailwind class'ları ve emoji'ler kaldırıldı, saf inline style
  - Genel Bakış: 6'lı metrik grid (Toplam Kampanya, Aktif, Bekleyen Onay, Açık Raporlar, Toplam Kullanıcı, Doğrulanmış Kurum) — bekleyen/raporlar amber tonunda vurgulanıyor
  - "Bekleyen İşlemler" paneli: sadece aksiyon gereken durumlar, her satır ilgili tab'a yönlendiriyor
  - Tab badge'leri: emoji yok, amber pill sayaç
  - Tüm listeler: satır bazlı, tutarlı spacing, sağda `ActionBtn` (primary/secondary)
  - EmptyState: "Bekleyen kampanya bulunmuyor." formatında soft mesaj
  - Entities: tablo yerine satır listesi, platform geneli ile tutarlı
  - Yeniden kullanılabilir bileşenler: `OverviewCard`, `MiniStat`, `PendingRow`, `ActionBtn`, `TabButton`

- Entities (Kurumlar) Page Refactor:
  - Tailwind class'ları kaldırıldı, tüm inline style
  - Header: başlık + "Kurumları incele, kampanyaları gör ve aksiyon al" subtitle
  - Search bar: tam genişlik, SVG arama ikonu, focus border efekti
  - Boş/geçersiz entity'ler filtrelendi
  - Kart: isim (bold) + description (truncated) + meta (tür, ülke, takipçi) + sağda "Kampanyaları Gör →"
  - Hover: border `#9ca3af` + background `#f9fafb`, gölge yok
  - Skeleton loading, boş durum dinamik mesaj
  - Backend `EntityService.search()` güncellendi: `campaign_count` ve `total_support` alanları eklendi, sıralama `campaign_count DESC`, limit 50
  - Kart metadata satırı: "X kampanya · X destek · X takipçi" data signals

- Homepage Engagement Improvements:
  - Live signal block eklendi: trend kampanyaların üstünde `#f9fafb` arka planlı minimal blok — başlık, destek sayısı, "Destek ver" butonu
  - Hero altına helper text eklendi: "Henüz kampanya başlatmadın. İlk kampanyanı oluştur." (giriş yapmamış kullanıcılara)
  - Kampanya kartları: destek sayısı daha belirgin, hover border güçlendirildi, micro-guidance — `< 10 destek` ise "İlk destekçi ol", diğerleri "Destek ver"
  - "Nasıl Çalışır" adım başlıkları kısaltıldı: "Oluştur / Destek Topla / Sonuç Al"

- Homepage Refactor:
  - Marketing dili, gradient, emoji, renkli ikonlar tamamen kaldırıldı
  - Hero: sade başlık + subtext + 2 solid buton (`#1F2A44` primary)
  - Stats: büyük kartlar → tek satır inline metin ("X aktif kampanya · X destek · X kampanya")
  - Trend kampanyalar: campaign list sayfasıyla aynı kart tasarımı (border hover, kategori/status badge)
  - "Nasıl Çalışır": 3 adım, minimal kart, emoji yok
  - Özellikler: 4 item, düz kart, renk yok
  - CTA bölümü sadece giriş yapmamış kullanıcılara gösteriliyor
  - `StepCard` bileşeni kaldırıldı, footer kompaktlaştı

- Header (Navbar) Refactor:
  - Backdrop blur ve yarı saydam arka plan kaldırıldı, saf `#fff` arka plan
  - Ağır gölge kaldırıldı, scroll'da sadece `0 1px 4px rgba(0,0,0,0.06)`
  - Logo gradient kaldırıldı, `#1F2A44` solid, boyut küçüldü
  - Search bar: mavi focus ring kaldırıldı, sadece border rengi değişiyor, spinner monochrome gri
  - Bildirim ikonu: emoji → SVG bell ikonu, badge daha küçük ve soft kırmızı
  - "Yeni Kampanya" ve "Kayıt Ol": gradient kaldırıldı, `#1F2A44` solid buton
  - Header yüksekliği 3.75rem → 3.5rem, genel kompaktlaştırma

- Sidebar (Hamburger Menu) Refactor:
  - Tüm emoji ikonlar kaldırıldı, monochrome SVG ikonlarla değiştirildi
  - Sidebar genişliği 20rem → 17rem olarak optimize edildi
  - Logo ve avatar gradient kaldırıldı, `#1F2A44` solid renk kullanıldı
  - Gruplandırma: ANA / İŞLEM / HESAP başlıkları (uppercase label) ile hiyerarşi oluşturuldu
  - "Yeni Kampanya" solid dark buton olarak öne çıkarıldı (list item değil)
  - Çıkış Yap: varsayılanda gri, hover'da kırmızı
  - `SidebarLink` bileşeni `icon` prop'u string emoji → `React.ReactNode` (SVG) olarak güncellendi

- Campaign List Page UI Improvements:
  - İlk 2 kampanya "⭐ ÖNE ÇIKAN" badge + mavi border + hafif gölge ile öne çıkıyor
  - Social proof: "🔥 X kişi destekledi" + "👁 X görüntülendi" formatı, 1000+ sayılar kısaltılıyor (1.2B)
  - Status açıklamaları: "Aktif — destek toplanıyor", "Yanıt alındı — kurum cevap verdi" vb.
  - Hover efektleri: border highlight + shadow + translateY(-3px)
  - Aktif filtreler chip olarak gösteriliyor, ✕ ile kaldırılabiliyor + "Filtreleri temizle"
  - Empty state: arama terimine göre dinamik mesaj, "Filtreleri Sıfırla" + "Yeni Kampanya Oluştur" CTA
  - Microcopy: "X aktif kampanya" formatı

- Campaign Detail Page Conversion Redesign:
  - Hero section yeniden tasarlandı: 52px font-weight 900 destek sayısı, "X kişi destekledi" + "Son 24 saatte +X destek" momentum badge, progress bar (6px, koyu), primary "Destek Ver" CTA
  - Secondary CTA block: hero ile tab'lar arasında koyu `#1F2A44` banner — "Senin desteğin bu kampanyayı büyütür" + "Destek Ver" butonu (sadece desteklenmemişse)
  - Genel tab'ında "Ne Oldu?" başlığı, içerik sonunda "Bu değişimin parçası ol" CTA kartı
  - Final CTA: koyu `#1F2A44` blok, "Bu değişimin parçası ol" + "Bir destek, fark yaratır." + büyük "Destek Ver" butonu
  - Sağ sidebar: sticky destek kartı (büyük sayı + progress + "Destek Ver" + paylaşım butonları), kurum kartı, takip butonu, son destekleyenler
  - Sticky bottom bar: destek sayısı + bugün artışı + "Destek Ver" butonu (arşivde gizleniyor)
  - `SupportButton` bileşeni: `size` ve `fullWidth` prop'ları, desteklendikten sonra yeşil "Desteklediniz" + "Desteği geri çek" linki
  - Tüm mevcut logic korundu (status yönetimi, kanıt, timeline, soruşturma, paylaşım, şikayet)

- Campaign Detail Page Share Buttons UI:
  - Metin tabanlı butonlar (WA, X, TG) kaldırıldı, SVG icon butonlarla değiştirildi
  - `ShareButtons` reusable bileşeni eklendi: `size="md"` (42px) hero ve modal için, `size="sm"` (36px) sidebar için
  - Gerçek platform SVG ikonları: link zinciri, WhatsApp (yeşil), X (siyah), Telegram (mavi)
  - Hover'da tooltip: "Bağlantıyı kopyala", "WhatsApp'ta paylaş", "X'te paylaş", "Telegram'da paylaş"
  - Copy link sonrası ikon yeşil checkmark'a dönüyor
  - Destek sonrası share card'da "Daha fazla kişiye ulaştırmak için paylaş" mesajı (`postSupport` prop)
  - 3 lokasyonda güncellendi: hero share row, sticky sidebar, destek sonrası share modal

- Campaign Feed Page Redesign (Addictive Feed):
  - `frontend/app/campaigns/page.tsx` tamamen yeniden yazıldı
  - Sticky top bar: arama input + quick filter chips (Tümü / Trend / Yeni / En Çok Desteklenen / Yanıt Bekleyen), pill buton tasarımı
  - Feed layout: tek kolon feed + sağ sidebar (900px+ ekranlarda görünür)
  - Her kampanya kartı: category badge, trend badge (trending_score > 100 veya today_supporters > 5), status badge, büyük başlık, kurum adı + zaman meta, büyük destek sayısı, "+X bugün" momentum badge, kısa açıklama, "Destek Ver" + "Detaylar" butonları
  - Instant support: "Destek Ver" → API çağrısı → buton "Desteklendi" yeşile döner, sayaç +1 artar, alert yok
  - Giriş yapmamış kullanıcılar "Destek Ver" → `/auth/login` yönlendirmesi
  - Infinite scroll: IntersectionObserver ile sentinel div, `PAGE_SIZE=20`, `loadMore()` callback
  - Loading skeleton: `SkeletonCard` bileşeni, smooth görünüm
  - "Bugün X+ kişi destek verdi" banner (today_supporters toplamı > 0 ise)
  - Empty state: "Henüz kampanya yok. İlk kampanyayı sen başlat." + "Kampanya Başlat" CTA
  - Sağ sidebar: Platform Özeti (aktif/yanıt alındı/çözüldü sayıları), "Bugün Trend" top 5 liste, "Kampanya Başlat" CTA kartı
  - 400ms debounce ile arama
  - `useAuth()` ile user state kontrolü
  - Tüm inline style, emoji yok, gradient yok

### Admin Paneli
- Dashboard istatistikleri
- Kullanıcı yönetimi (rol değiştirme, ban)
- Kampanya onay/red
- Kurum doğrulama
- Şikayet yönetimi (`GET /admin/campaign-reports`, `PATCH /admin/campaign-reports/:id`)
- Standart öneri yönetimi (`GET /admin/standard-suggestions`, `PATCH /admin/standard-suggestions/:id`)
- Avukat doğrulama: `GET /admin/lawyers/pending`, `POST /admin/lawyers/:lawyerId/verify`

### Avukat Marketplace (Lawyer Marketplace)
- Kampanya hukuki destek talebi: min 50 destek VE (yanıt süresi dolmuş VEYA `no_response`/`closed_unresolved` durumu) koşullarında aktif
- `GET /campaigns/:id/legal-status` — eligibility kontrolü + mevcut talep durumu (avukat profil bilgileri dahil)
- `POST /campaigns/:id/legal-request` — kampanya sahibi avukat talep eder
- `GET /legal-requests` — açık talepleri listeler (avukat paneli); kampanya status, deadline, reopen_count bilgileri dahil, destek sayısına göre sıralı
- `POST /legal-requests/:requestId/apply` — avukat başvurur; transaction ile race condition koruması, first-come-first-served
- `POST /lawyers/register` — kullanıcı avukat olarak kaydolur (admin onayı bekler)
- `GET /lawyers/me` — kendi avukat profilini getirir
- `frontend/app/lawyers/page.tsx` — avukat paneli: kayıt formu, açık talepler, "İlgileniyorum" butonu
- `LawyerService.ts`: getLegalStatus, requestLegalSupport, applyToRequest, registerLawyer, verifyLawyer, checkMatchTimeouts
- `add-lawyer-marketplace.js` migration — `lawyers`, `legal_requests`, `lawyer_applications` tabloları
- `add-legal-enhancements.js` migration — `legal_requests` tablosuna `reopen_count`, `last_reopened_at` kolonları eklendi
- Yasal disclaimer: "EQUA herhangi bir hukuki sürecin tarafı değildir."
- Avukat eşleşmesinde bildirim: eşleşme gerçekleştiğinde hem kampanya sahibine hem avukata `lawyer_matched` tipi bildirim gönderiliyor
- Hamburger menüye "Avukatlar" linki eklendi (giriş yapmış ve yapmamış kullanıcılar için)
- Admin paneli avukat doğrulama: `GET /admin/lawyers/pending`, `POST /admin/lawyers/:lawyerId/verify`, `POST /admin/lawyers/:lawyerId/reject`
- Avukat başına max 3 aktif kampanya limiti — aşılırsa hata mesajı
- 48 saat match timeout: yanıt vermeyen avukatın eşleşmesi iptal edilir, kampanya yeniden açılır (`LEGAL_REOPENED` state), kullanıcıya bildirim gider; server'da 6 saatte bir çalışan cron job
- Eşleşme sonrası timeline'a `lawyer_matched` tipi güncelleme ekleniyor: "Bir avukat kampanyayla ilgilenmeye başladı"
- Kampanya sayfası "Hukuki Destek" kartı — 5 net state: LOCKED / AVAILABLE / PENDING / REOPENED / MATCHED; MATCHED state herkese görünür; avukat profil kartı (isim, uzmanlık, şehir, doğrulandı badge, bio); "Bu otomatik hukuki işlem değildir" micro guidance
- Avukat paneli kampanya kartları: status badge (Yanıt yok / Süre doldu / Aktif), "Yeniden açıldı" badge, destek sayısı öne çıkarıldı

### Onboarding Modal + Kampanya Oluşturma AI Yardımcısı
- `frontend/components/OnboardingModal.tsx` — ilk ziyaret modalı (localStorage key: `equa_onboarding_seen`)
  - Sadece giriş yapmamış kullanıcılara, ilk ziyarette gösterilir
  - İçerik: "EQUA'ya hoş geldin" başlığı, platform açıklaması, 4 adım (01-04), 2 CTA butonu
  - "Ne yapmak istiyorsun?" intent selector: Kampanya başlatmak / Destek vermek / Kurumları incelemek
  - Dışarı tıklayarak veya "Şimdi değil" ile kapatılabilir
  - `frontend/app/page.tsx`'e `<OnboardingModal />` eklendi (giriş yapmamış kullanıcılara otomatik gösterilir)
- Kampanya oluşturma formuna contextual AI suggestion hints eklendi (`frontend/app/campaigns/new/page.tsx`):
  - Title hint: 10+ karakter yazıldıktan 400ms sonra, başlık vague ise (kurum adı yok veya çok kısa) mavi info box gösterilir — "Başlık daha spesifik olabilir. Kurum adı ve somut sorunu belirt."
  - Description hint: blur event'te, 100 karakterden kısa ise yapı önerisi gösterilir — "Sorun nedir? / Kim etkileniyor? / Ne talep ediliyor?"
  - Category hint: kategori seçilince yeşil info box — "Bu kampanya [Kategori] kapsamında olabilir. Adım 2'de talebini net yaz."
  - Preview modal'da "Kampanya özeti" kutusu: başlık + açıklama ilk 120 karakteri otomatik birleştirilerek gösterilir
  - Tüm hint'ler × butonu ile kapatılabilir, kullanıcı görmezden gelebilir
  - External API yok — tamamen client-side logic

## Önemli DB Tabloları
```
users                  — id, email, username, password, role, entity_id, reputation
campaigns              — id, title, description, status, creator_id, entity_id, views, investigation_mode, victory_at, victory_support_count, ...
signatures             — id, campaign_id, user_id, message, is_anonymous
campaign_updates       — id, campaign_id, type, title, content, source_url, is_pinned
campaign_views         — id, campaign_id, user_id, ip_address, created_at
campaign_reports       — id, campaign_id, user_id, reason, description, status
campaign_followers     — id, campaign_id, user_id
campaign_status_history — id, campaign_id, old_status, new_status, reason
entities               — id, name, slug, type, verified
entity_followers       — id, entity_id, user_id
entity_metrics         — id, entity_id, campaign_count, response_count, resolved_count, no_response_count, avg_response_time_days, response_rate, last_calculated_at
entity_transparency_metrics — id, entity_id TEXT, total_campaigns, response_received, resolved_campaigns, ignored_campaigns, average_response_days, transparency_score, last_calculated_atevidence               — id, campaign_id, type, title, url, status (pending/approved/rejected/flagged), credibility_type, flag_count, verification_source
evidence_flags         — id, evidence_id, user_id (unique per user+evidence)
notifications          — id, user_id, type, title, message, entity_type, entity_id, is_read, created_at
standard_categories       — id, name, description
standards                 — id, title, description, category_id, source_url
standard_suggestions      — id, title, description, category_id, source_url, suggested_by (TEXT), ai_confidence, status
lawyers                   — id, user_id, full_name, expertise, bar_number, city, bio, is_verified, is_active
legal_requests            — id, campaign_id, requester_id, status (pending/matched/closed), matched_lawyer_id, matched_at, reopen_count, last_reopened_at
lawyer_applications       — id, legal_request_id, lawyer_id, note (unique per lawyer+request)
```

## API Yapısı (Önemli Endpoint'ler)
```
POST   /auth/login
POST   /auth/register
GET    /auth/profile

GET    /campaigns
POST   /campaigns
GET    /campaigns/:id
PATCH  /campaigns/:id/status
POST   /campaigns/:id/view
POST   /campaigns/:id/report
GET    /campaigns/:id/report
POST   /campaigns/:id/follow
GET    /campaigns/:id/follow
POST   /campaigns/:id/updates
POST   /campaigns/:id/updates/official-response
POST   /campaigns/:id/evidence

GET    /entities/:slug
GET    /entities/:slug/metrics
GET    /entities/:slug/transparency-score
POST   /entities/:slug/follow

GET    /admin/campaign-reports
PATCH  /admin/campaign-reports/:id
POST   /admin/entities/:entityId/institution-account

POST   /campaigns/:id/share
GET    /campaigns/:id/share-stats
GET    /campaigns/similar?query={title}
POST   /campaigns/:id/resolve
POST   /campaigns/:id/close
GET    /campaigns/:id/impact
GET    /campaigns/:id/victory
GET    /campaigns/:id/momentum
GET    /campaigns/:id/milestone

GET    /campaigns/:id/investigation-summary
PATCH  /campaigns/:id/investigation-mode

GET    /standards/categories
GET    /standards
POST   /standards/suggest
GET    /admin/standard-suggestions
PATCH  /admin/standard-suggestions/:id

POST   /campaigns/evidence/:id/approve
POST   /campaigns/evidence/:id/reject
POST   /campaigns/evidence/:id/flag
GET    /campaigns/:id/evidence-summary
GET    /admin/flagged-evidence

GET    /campaigns/:id/legal-status
POST   /campaigns/:id/legal-request
GET    /legal-requests
POST   /legal-requests/:requestId/apply
POST   /lawyers/register
GET    /lawyers/me
GET    /admin/lawyers/pending
POST   /admin/lawyers/:lawyerId/verify
```

## Production Deployment

- **Platform:** Backend → Railway, Frontend → Vercel
- **Railway backend URL:** `https://equa-production.up.railway.app`
- **Vercel frontend URL:** `https://equa-three.vercel.app`
- **Railway DB public URL:** `postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway`
- **Railway DB internal URL:** `postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@postgres.railway.internal:5432/railway` (sadece Railway servisleri)
- **Vercel env:** `NEXT_PUBLIC_API_URL=https://equa-production.up.railway.app/api/v1`
- **Railway env:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`

### Migration Scripti
- `backend/migrate-all.js` — tüm tabloları ve kolonları `IF NOT EXISTS` ile oluşturur, güvenle tekrar çalıştırılabilir
- Local: `node migrate-all.js`
- Railway: `DATABASE_URL=postgresql://...@caboose.proxy.rlwy.net:28741/railway node migrate-all.js`
- Yeni özellik deploy edildiğinde bu script Railway'de çalıştırılmalı

## Notlar (İleride Eklenebilir)

## Kod Yazma Kuralları
- Inline style kullan, Tailwind custom variable kullanma
- Her yeni özellik için migration script `backend/add-*.js` formatında
- Test scriptleri `backend/test-*.js` formatında
- `api.ts`'e yeni endpoint eklerken duplicate metod kontrolü yap
- Backend TypeScript — `src/` altında, migration'lar plain JS
