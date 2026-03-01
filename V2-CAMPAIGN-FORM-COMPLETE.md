# V2 KAMPANYA FORMU TAMAMLANDI ✅

## 🎯 YENİ ÖZELLİKLER

### 1️⃣ STANDART REFERANSI (ZORUNLU) ✅
**Alan:** `standard_reference` + `standard_reference_other`

**Seçenekler:**
- İnsan Hakları Evrensel Beyannamesi
- ILO Çalışma Standartları
- Tüketici Koruma Mevzuatı
- Çevresel Sürdürülebilirlik İlkeleri
- Kurumsal Şeffaflık İlkeleri
- Diğer (manuel açıklama zorunlu)

**Validasyon:**
- ✅ Boş bırakılamaz
- ✅ "Diğer" seçilirse açıklama zorunlu
- ✅ Frontend ve backend validasyonu

**Etki:**
- Kampanyalar artık hukuki/etik temele dayanıyor
- Platform ciddiyeti artıyor
- Admin onayında standart kontrolü yapılabilir

---

### 2️⃣ NET TALEP ALANI (ZORUNLU) ✅
**Alan:** `demanded_action`

**Özellikler:**
- Minimum 20 karakter
- Serbest metin
- Placeholder: "Bu kampanya sonucunda ilgili kurumdan hangi somut adımı talep ediyorsunuz?"

**Validasyon:**
- ✅ Boş bırakılamaz
- ✅ En az 20 karakter
- ✅ Frontend ve backend kontrolü

**Etki:**
- Kampanyalar artık net talep içeriyor
- "Sadece bağırma" platformu olmaktan çıkıyor
- Ölçülebilir sonuçlar için temel oluşuyor

---

### 3️⃣ KANIT ZORUNLU ✅
**Alan:** `evidence` (mevcut alan, validasyon güçlendirildi)

**Kurallar:**
- ✅ En az 1 web linki VEYA 1 belge zorunlu
- ✅ "Opsiyonel" yazısı kaldırıldı
- ✅ Başlık: "📋 Kanıtlar *"

**Validasyon:**
```javascript
if (evidence.links.length === 0 && evidence.documents.length === 0) {
  setError('En az 1 web linki veya belge eklemelisiniz');
  return;
}
```

**Etki:**
- Asılsız kampanyalar engelleniyor
- Platform güvenilirliği artıyor
- Admin onayı daha kolay

---

### 4️⃣ YANIT SÜRESİ ✅
**Alan:** `response_deadline_days` + `response_deadline_date`

**Seçenekler:**
- 15 gün
- 30 gün (varsayılan)
- 45 gün
- 60 gün

**Otomatik İşlemler:**
- ✅ `response_deadline_date` otomatik hesaplanıyor (SQL: `datetime('now', '+X days')`)
- ✅ Timeline oluşturma için temel hazır
- ✅ Bildirim sistemi için süre takibi

**Planlanan Timeline:**
1. ✅ Kampanya Açıldı
2. 🔄 Kuruma İletildi (sent_to_organization_at)
3. 🔄 Yanıt Bekleniyor (xx gün kaldı)
4. 🔄 Süre Doldu / Yanıt Verildi

**Etki:**
- Platform ciddileşiyor
- Kurumlar baskı altında
- Takip edilebilir süreç

---

## 📊 TEKNİK DETAYLAR

### Database Schema
```sql
ALTER TABLE campaigns ADD COLUMN standard_reference TEXT;
ALTER TABLE campaigns ADD COLUMN standard_reference_other TEXT;
ALTER TABLE campaigns ADD COLUMN demanded_action TEXT;
ALTER TABLE campaigns ADD COLUMN response_deadline_days INTEGER;
ALTER TABLE campaigns ADD COLUMN response_deadline_date DATETIME;
ALTER TABLE campaigns ADD COLUMN sent_to_organization_at DATETIME;
```

### Backend Service
**Dosya:** `backend/src/services/campaignService.ts`

**Yeni Interface:**
```typescript
interface CreateCampaignDTO {
  // ... mevcut alanlar
  standard_reference: string;
  standard_reference_other?: string;
  demanded_action: string;
  response_deadline_days: number;
}
```

**Insert Query:**
```typescript
INSERT INTO campaigns (
  ..., standard_reference, standard_reference_other, 
  demanded_action, response_deadline_days, response_deadline_date
)
VALUES (..., ?, ?, ?, ?, datetime('now', '+' || ? || ' days'))
```

### Frontend Form
**Dosya:** `frontend/app/campaigns/new/page.tsx`

**Yeni State:**
```typescript
const [formData, setFormData] = useState({
  // ... mevcut alanlar
  standard_reference: '',
  standard_reference_other: '',
  demanded_action: '',
  response_deadline_days: 30,
});
```

**Validasyonlar:**
1. Standard reference boş olamaz
2. "Diğer" seçilirse açıklama zorunlu
3. Demanded action min 20 karakter
4. En az 1 kanıt (link veya belge)

---

## ✅ TAMAMLANAN İŞLEMLER

1. ✅ Database migration çalıştırıldı
2. ✅ Backend service güncellendi
3. ✅ Frontend form güncellendi
4. ✅ Validasyonlar eklendi
5. ✅ TypeScript hataları yok
6. ✅ Backend başarıyla çalışıyor
7. ✅ Frontend başarıyla çalışıyor

---

## 🎯 SONUÇ

Platform artık **V2 Kampanya Formu** ile çalışıyor:

### Öncesi (V1)
- ❌ Standart referansı yok
- ❌ Net talep yok
- ❌ Kanıt opsiyonel
- ❌ Süre takibi yok
- ❌ "Bağırma platformu" riski

### Sonrası (V2)
- ✅ Hukuki/etik temele dayalı
- ✅ Net ve somut talepler
- ✅ Kanıt zorunlu
- ✅ Süre takibi var
- ✅ Ciddi denetim aracı

**Platform artık profesyonel bir aktivizm aracı!**

---

## 📝 SONRAKI ADIMLAR (OPSİYONEL)

### 1. Timeline Sistemi
- Kampanya detay sayfasında timeline gösterimi
- Otomatik durum güncellemeleri
- Süre dolunca bildirim

### 2. Admin Onay Kriterleri
- Standart referansı kontrolü
- Kanıt kalitesi değerlendirmesi
- Talep netliği kontrolü

### 3. Kurum İletişimi
- `sent_to_organization_at` alanı kullanımı
- Otomatik email gönderimi
- Yanıt takibi

### 4. Raporlama
- Standart bazlı istatistikler
- Yanıt süresi analizleri
- Başarı oranları

---

## 🧪 TEST ÖNERİLERİ

1. Yeni kampanya oluştur
2. Tüm alanları boş bırakıp validasyonları test et
3. "Diğer" standardı seç ve açıklama ekle
4. Kanıt eklemeden göndermeyi dene
5. Başarılı kampanya oluştur ve veritabanını kontrol et

**Test Hesabı:** testlogin@example.com / 12345678
