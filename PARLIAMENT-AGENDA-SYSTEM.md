# 🏛️ "Halk Ne Diyor" - Meclis Gündem Sistemi

**Tarih:** 25 Şubat 2026  
**Durum:** 🔧 Altyapı Hazır (Backend/Frontend Bekleniyor)

---

## 🎯 Konsept

Demokratik ülkelerde mecliste görüşülecek konuları halkın önceden görebilmesi ve fikirlerini paylaşabilmesi için bir platform.

### Amaç
- 📜 Meclis gündemlerini şeffaf hale getirmek
- 🗳️ Halkın görüşünü almak (Evet/Hayır/Kararsızım)
- 💬 Halkın yorum yapabilmesi
- 📊 Bölgesel istatistikler (şehir bazında sonuçlar)
- 🔔 Gündem takibi ve bildirimler

---

## 🗄️ Veritabanı Yapısı

### ✅ parliament_agendas (Meclis Gündemleri)
```sql
- id: Unique ID
- country: Ülke (Türkiye, Almanya, vb.)
- title: Gündem başlığı
- description: Detaylı açıklama
- category: Kategori (Ekonomi, Eğitim, Sağlık, Adalet, Çevre)
- agenda_type: Tür (law_proposal, budget, policy, amendment, other)
- official_document_url: Resmi belge linki
- discussion_date: Görüşme tarihi
- vote_date: Oylama tarihi
- status: Durum (upcoming, discussing, voted, passed, rejected)
- official_result: Resmi sonuç
- created_by: Oluşturan kullanıcı
```

### ✅ public_opinion_votes (Halk Oyları)
```sql
- id: Unique ID
- agenda_id: Gündem ID
- user_id: Kullanıcı ID
- vote_choice: Oy (support, oppose, undecided)
- comment: Kısa yorum
- is_anonymous: Anonim mi?
- city: Şehir (bölgesel istatistik için)
```

### ✅ agenda_comments (Gündem Yorumları)
```sql
- id: Unique ID
- agenda_id: Gündem ID
- user_id: Kullanıcı ID
- parent_id: Üst yorum (nested replies)
- content: Yorum içeriği
```

### ✅ agenda_followers (Gündem Takipçileri)
```sql
- id: Unique ID
- agenda_id: Gündem ID
- user_id: Kullanıcı ID
```

---

## 🎨 Planlanan Özellikler

### 1. Gündem Listesi
- Ülke bazlı filtreleme
- Kategori filtreleme (Ekonomi, Eğitim, vb.)
- Durum filtreleme (Yaklaşan, Görüşülüyor, Oylandı)
- Tarih sıralama

### 2. Gündem Detayı
- Başlık ve açıklama
- Resmi belge linki
- Görüşme/oylama tarihleri
- Halk oylaması sonuçları (%)
- Bölgesel sonuçlar (şehir bazında)
- Yorum bölümü

### 3. Halk Oylaması
- Evet/Hayır/Kararsızım
- Anonim oy seçeneği
- Şehir bilgisi (isteğe bağlı)
- Kısa yorum (opsiyonel)

### 4. İstatistikler
- Genel sonuçlar (% dağılımı)
- Şehir bazında sonuçlar
- Yaş grubu analizi (gelecekte)
- Trend grafikleri

### 5. Bildirimler
- Yeni gündem eklendi
- Gündem görüşmeye alındı
- Oylama sonuçlandı
- Takip edilen gündemde güncelleme

---

## 🚀 Kullanım Senaryoları

### Senaryo 1: Vatandaş
1. Ülkesinin meclis gündemlerini görür
2. İlgisini çeken bir gündem seçer
3. Detayları okur, resmi belgeyi inceler
4. Oy verir (Evet/Hayır/Kararsızım)
5. Yorum yapar
6. Gündemi takip eder
7. Sonuçları görür (halkın %kaç'ı ne diyor)

### Senaryo 2: Aktivist/Sivil Toplum
1. Yeni gündem oluşturur (moderatör onayı ile)
2. Resmi belge linkini ekler
3. Halkın görüşünü toplar
4. Sonuçları milletvekillerine iletir
5. Şeffaflık sağlar

### Senaryo 3: Araştırmacı
1. Geçmiş gündemleri inceler
2. Bölgesel farklılıkları analiz eder
3. Halkın görüşü vs resmi sonuç karşılaştırması
4. Demokratik katılım araştırması

---

## 📊 Örnek Gündemler

### Türkiye
- "Asgari Ücret Artışı Kanun Teklifi"
- "Eğitim Reformu Paketi"
- "Çevre Koruma Yasası Değişikliği"

### Almanya
- "Renewable Energy Act Amendment"
- "Digital Services Tax Proposal"
- "Immigration Policy Reform"

---

## 🔧 Yapılacaklar (TODO)

### Backend
- [ ] ParliamentAgendaService oluştur
- [ ] ParliamentAgendaController oluştur
- [ ] Routes tanımla
- [ ] API endpoints:
  - GET /parliament-agendas
  - GET /parliament-agendas/:id
  - POST /parliament-agendas (moderator)
  - POST /parliament-agendas/:id/vote
  - GET /parliament-agendas/:id/statistics

### Frontend
- [ ] /parliament-agendas sayfası (liste)
- [ ] /parliament-agendas/[id] sayfası (detay)
- [ ] Oylama komponenti
- [ ] İstatistik grafikleri
- [ ] Yorum sistemi
- [ ] Header'a link ekle

### Test
- [ ] Test gündemleri oluştur
- [ ] Test oyları ekle
- [ ] İstatistik hesaplamalarını test et

---

## 💡 Gelecek İyileştirmeler

1. **AI Özeti** - Uzun belgelerin AI ile özetlenmesi
2. **Çeviri** - Gündemlerin otomatik çevirisi
3. **Video Açıklama** - Gündem hakkında video içerik
4. **Milletvekili Görüşleri** - Milletvekillerinin açıklamaları
5. **Karşılaştırma** - Benzer ülkelerdeki durumlar
6. **Blockchain** - Oy kayıtlarının blockchain'de saklanması

---

## 🎉 Vizyon

"Halk Ne Diyor" özelliği ile:
- ✅ Demokratik katılım artar
- ✅ Şeffaflık sağlanır
- ✅ Halkın sesi duyulur
- ✅ Bilinçli vatandaşlık desteklenir
- ✅ Sivil toplum güçlenir

---

**Not:** Veritabanı tabloları oluşturuldu ve hazır. Backend service ve frontend geliştirme bekleniyor.
