# 📱 Topluluk Hub - Detaylı Plan

## 🎯 Genel Bakış

**Konsept:** Boykot platformunu sosyal bir topluluk merkezine dönüştürmek
**Hedef:** Kullanıcı etkileşimini 10x artırmak, günlük aktif kullanıcı sayısını maksimize etmek

---

## 🏗️ Mimari Yapı

```
📱 Topluluk Hub (/community)
│
├── 💬 Tartışmalar (/community/discussions)
│   ├── Tüm Gönderiler
│   ├── Takip Ettiklerim
│   ├── Trend Konular
│   └── Hashtag Arama
│
├── 📰 Haber Akışı (/community/feed)
│   ├── Kişiselleştirilmiş Feed
│   ├── Kampanya Güncellemeleri
│   ├── Topluluk Gönderileri
│   └── Önerilen İçerik
│
├── 🎤 Anketler (/community/polls)
│   ├── Aktif Anketler
│   ├── Tamamlanan Anketler
│   ├── Anket Oluştur
│   └── Sonuçlar & İstatistikler
│
├── 🏆 Başarı Hikayeleri (/community/success)
│   ├── Kazanılan Kampanyalar
│   ├── Etki Raporları
│   ├── Kullanıcı Hikayeleri
│   └── Medya Yansımaları
│
└── 🎮 Liderlik & Rozetler (/community/achievements)
    ├── Liderlik Tablosu (mevcut)
    ├── Rozet Galerisi
    ├── Seviye Sistemi
    └── Günlük Görevler
```

---

## 📊 Veritabanı Şeması

### 1. 💬 Tartışmalar (Discussions)

```sql
CREATE TABLE community_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL, -- max 500 karakter
  type TEXT DEFAULT 'post', -- post, share, quote
  parent_id TEXT, -- reply için
  campaign_id TEXT, -- kampanyaya bağlı ise
  poll_id TEXT, -- ankete bağlı ise
  media_url TEXT, -- resim/video
  hashtags TEXT, -- JSON array
  mentions TEXT, -- JSON array (@username)
  is_pinned INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0, -- doğrulanmış hesap
  visibility TEXT DEFAULT 'public', -- public, followers, private
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (parent_id) REFERENCES community_posts(id)
);

CREATE TABLE post_likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES community_posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_bookmarks (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES community_posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(post_id, user_id)
);

CREATE TABLE hashtags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  trending_score REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id),
  UNIQUE(follower_id, following_id)
);
```

### 2. 🎤 Anketler (Polls)

```sql
CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'single', -- single, multiple
  duration INTEGER DEFAULT 7, -- gün
  is_anonymous INTEGER DEFAULT 0,
  campaign_id TEXT, -- kampanyaya bağlı ise
  status TEXT DEFAULT 'active', -- active, closed, draft
  total_votes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ends_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE poll_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (poll_id) REFERENCES polls(id)
);

CREATE TABLE poll_votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id),
  FOREIGN KEY (option_id) REFERENCES poll_options(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(poll_id, user_id, option_id)
);
```

### 3. 🏆 Başarı Hikayeleri (Success Stories)

```sql
CREATE TABLE success_stories (
  id TEXT PRIMARY KEY,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE story_reactions (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL, -- inspiring, helpful, amazing
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES success_stories(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(story_id, user_id)
);
```

### 4. 🎮 Gamification Genişletme

```sql
CREATE TABLE user_levels (
  user_id TEXT PRIMARY KEY,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  next_level_xp INTEGER DEFAULT 100,
  total_xp INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE daily_quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL, -- post, vote, comment, share
  target_count INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 10,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_quest_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  completed_at DATETIME,
  date DATE DEFAULT CURRENT_DATE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES daily_quests(id),
  UNIQUE(user_id, quest_id, date)
);

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- social, campaign, community
  requirement TEXT NOT NULL, -- JSON: {type, count}
  xp_reward INTEGER DEFAULT 50,
  rarity TEXT DEFAULT 'common' -- common, rare, epic, legendary
);

CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id),
  UNIQUE(user_id, achievement_id)
);
```

### 5. 📰 Feed Algoritması

```sql
CREATE TABLE feed_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- feed sahibi
  item_type TEXT NOT NULL, -- post, campaign, poll, story
  item_id TEXT NOT NULL,
  relevance_score REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_interests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  interest_type TEXT NOT NULL, -- category, hashtag, user
  interest_value TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, interest_type, interest_value)
);
```

---

## 🎨 UI/UX Tasarım

### Ana Navigasyon Güncellemesi

```
Sidebar:
├── 🏠 Ana Sayfa
├── 📢 Kampanyalar
├── 🌐 Topluluk 🆕
│   ├── 💬 Tartışmalar
│   ├── 📰 Haber Akışı
│   ├── 🎤 Anketler
│   ├── 🏆 Başarı Hikayeleri
│   └── 🎮 Liderlik & Rozetler
├── ⚖️ Avukatlar
├── 📊 İstatistikler
└── ...
```

### Sayfa Tasarımları

#### 1. 💬 Tartışmalar Sayfası
```
┌─────────────────────────────────────┐
│ 💬 Tartışmalar                      │
├─────────────────────────────────────┤
│ [Yeni Gönderi Oluştur]             │
├─────────────────────────────────────┤
│ Filtreler: [Tümü] [Takip] [Trend]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 👤 @kullanici · 2s              │ │
│ │ Bu kampanyayı destekliyorum!    │ │
│ │ #adalet #boykot                 │ │
│ │ ❤️ 45  💬 12  🔄 8              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 👤 @admin · 5dk                 │ │
│ │ Yeni kampanya başlattık! 🚀     │ │
│ │ [Kampanya Kartı]                │ │
│ │ ❤️ 128  💬 34  🔄 56            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 2. 📰 Haber Akışı
```
┌─────────────────────────────────────┐
│ 📰 Senin İçin                       │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📢 Yeni Kampanya                │ │
│ │ "X Markasını Boykot"            │ │
│ │ 234 imza · 2 saat önce          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 💬 @kullanici paylaştı          │ │
│ │ "Harika bir gelişme!"           │ │
│ │ ❤️ 45  💬 12                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🎤 Aktif Anket                  │ │
│ │ "Hangi kategori öncelikli?"     │ │
│ │ 🔵 45% 🟢 30% 🟡 25%            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 3. 🎤 Anketler
```
┌─────────────────────────────────────┐
│ 🎤 Anketler                         │
├─────────────────────────────────────┤
│ [+ Yeni Anket Oluştur]             │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Hangi sektörde daha fazla       │ │
│ │ kampanya görmek istersiniz?     │ │
│ │                                 │ │
│ │ ○ Gıda (234 oy) ████████ 45%   │ │
│ │ ○ Teknoloji (156 oy) █████ 30% │ │
│ │ ○ Tekstil (130 oy) ████ 25%    │ │
│ │                                 │ │
│ │ 520 oy · 2 gün kaldı            │ │
│ │ [Oy Ver]                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 4. 🏆 Başarı Hikayeleri
```
┌─────────────────────────────────────┐
│ 🏆 Başarı Hikayeleri                │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Öne Çıkan Resim]               │ │
│ │                                 │ │
│ │ X Markası Özür Diledi!          │ │
│ │ 15.000 imza · 3 ay sürdü        │ │
│ │ %100 başarı oranı               │ │
│ │                                 │ │
│ │ "Topluluk gücüyle..."           │ │
│ │ [Devamını Oku]                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 5. 🎮 Liderlik & Rozetler
```
┌─────────────────────────────────────┐
│ 🎮 Seviye 12 - Aktivist             │
├─────────────────────────────────────┤
│ XP: 2,450 / 3,000 ████████░░ 82%   │
├─────────────────────────────────────┤
│ 📋 Günlük Görevler                  │
│ ✅ 3 gönderi paylaş (3/3) +10 XP    │
│ ⏳ 5 kampanyaya oy ver (2/5) +15 XP │
│ ⏳ 1 anket oluştur (0/1) +20 XP     │
├─────────────────────────────────────┤
│ 🏆 Rozetlerim (12/50)               │
│ 🥇 🥈 🥉 ⭐ 🔥 💎 ...              │
├─────────────────────────────────────┤
│ 📊 Liderlik Tablosu                 │
│ 1. @user1 - 15,234 XP 👑            │
│ 2. @user2 - 12,456 XP               │
│ 3. @user3 - 10,789 XP               │
│ ...                                 │
│ 42. Sen - 2,450 XP                  │
└─────────────────────────────────────┘
```

---

## 🚀 Geliştirme Aşamaları

### Faz 1: Temel Altyapı (2-3 gün)
- ✅ Veritabanı tabloları
- ✅ Backend API endpoints
- ✅ Temel CRUD işlemleri

### Faz 2: Tartışmalar (2-3 gün)
- ✅ Post oluşturma/silme/düzenleme
- ✅ Beğeni/Yorum sistemi
- ✅ Hashtag sistemi
- ✅ Mention sistemi
- ✅ Takip sistemi

### Faz 3: Haber Akışı (2 gün)
- ✅ Feed algoritması
- ✅ Kişiselleştirme
- ✅ Karışık içerik (post + kampanya)
- ✅ Sonsuz scroll

### Faz 4: Anketler (1-2 gün)
- ✅ Anket oluşturma
- ✅ Oy verme
- ✅ Sonuç görüntüleme
- ✅ Anket istatistikleri

### Faz 5: Başarı Hikayeleri (1-2 gün)
- ✅ Hikaye oluşturma (admin)
- ✅ Hikaye görüntüleme
- ✅ Etki metrikleri
- ✅ Kullanıcı tepkileri

### Faz 6: Gamification (2 gün)
- ✅ Seviye sistemi
- ✅ XP kazanma
- ✅ Günlük görevler
- ✅ Başarımlar
- ✅ Rozet sistemi genişletme

### Faz 7: UI/UX (2-3 gün)
- ✅ Tüm sayfalar
- ✅ Responsive tasarım
- ✅ Animasyonlar
- ✅ Loading states

### Faz 8: Moderasyon (1-2 gün)
- ✅ Spam filtreleme
- ✅ Rapor sistemi
- ✅ Admin moderasyon araçları
- ✅ Otomatik moderasyon

---

## 📈 Başarı Metrikleri

**Hedefler:**
- 📊 Günlük aktif kullanıcı: +200%
- ⏱️ Ortalama oturum süresi: +150%
- 🔄 Geri dönüş oranı: +180%
- 💬 Kullanıcı etkileşimi: +300%
- 📢 Kampanya başlatma: +50%

---

## 🎯 Toplam Süre Tahmini

**Minimum:** 13-16 gün
**Maksimum:** 18-22 gün

**Önerim:** Aşamalı geliştirme
- Önce Faz 1-2 (Tartışmalar) → Test
- Sonra Faz 3-4 (Feed + Anketler) → Test
- Son olarak Faz 5-6 (Hikayeler + Gamification) → Launch

---

## 💡 Ek Öneriler

1. **Moderasyon Öncelikli:** Spam ve toksik içerik kontrolü kritik
2. **Mobil Uyumlu:** Responsive tasarım şart
3. **Bildirimler:** Yeni etkileşimler için push notification
4. **SEO:** Başarı hikayeleri için SEO optimizasyonu
5. **Analytics:** Kullanıcı davranışlarını takip et

---

## 🤔 Başlayalım mı?

Hangi fazdan başlamak istersin?

**A)** Faz 1-2: Tartışmalar (En popüler, hızlı etki)
**B)** Faz 3-4: Feed + Anketler (Kişiselleştirme)
**C)** Faz 5-6: Hikayeler + Gamification (Motivasyon)
**D)** Hepsini sırayla (Tam paket)

Veya önce bir prototip/mockup mu görmek istersin? 😊
