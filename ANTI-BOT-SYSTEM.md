# 🛡️ Anti-Bot Koruma Sistemi

## 📅 Tarih: 4 Şubat 2026

---

## ✅ Eklenen Özellikler

### 1. **Veritabanı Tabloları**

```sql
✅ phone_verifications      - Telefon doğrulama
✅ device_fingerprints       - Cihaz parmak izi
✅ ip_activity               - IP aktivite takibi
✅ suspicious_activity       - Şüpheli aktivite logu
✅ blocked_ips               - Engellenmiş IP'ler
✅ blocked_email_domains     - Geçici email domainleri
```

### 2. **Users Tablosuna Eklenen Alanlar**

```sql
✅ phone_number              - Telefon numarası
✅ phone_verified            - Telefon doğrulandı mı?
✅ phone_verified_at         - Doğrulama tarihi
✅ device_fingerprint        - Cihaz parmak izi
✅ last_ip                   - Son IP adresi
```

### 3. **Anti-Bot Servisi** (`antiBotService.ts`)

**Fonksiyonlar:**
- ✅ `isDisposableEmail()` - Geçici email kontrolü
- ✅ `checkIPActivity()` - IP aktivite limiti
- ✅ `checkDeviceFingerprint()` - Cihaz kontrolü
- ✅ `checkAccountAge()` - Hesap yaşı kontrolü
- ✅ `performBotCheck()` - Kapsamlı bot kontrolü
- ✅ `logSuspiciousActivity()` - Şüpheli aktivite kaydı
- ✅ `blockIP()` - IP engelleme

### 4. **Backend Entegrasyonu**

**Tamamlanan:**
- ✅ `authService.ts` - Kayıt/giriş bot kontrolü
- ✅ `authController.ts` - IP ve device fingerprint çıkarma
- ✅ `signatureService.ts` - İmza bot kontrolü
- ✅ `signatureController.ts` - Telefon doğrulama uyarısı
- ✅ `campaignService.ts` - Kampanya oluşturma bot kontrolü
- ✅ `campaignController.ts` - IP ve device fingerprint
- ✅ `communityService.ts` - Post oluşturma bot kontrolü
- ✅ `communityController.ts` - Telefon doğrulama uyarısı

---

## 🎯 Koruma Katmanları

### **Katman 1: Email Kontrolü**
```javascript
❌ 10minutemail.com
❌ guerrillamail.com
❌ tempmail.org
❌ mailinator.com
// + 6 tane daha
```

### **Katman 2: IP Limitleri**
```javascript
Kayıt:  Max 3/gün
İmza:   Max 50/gün
Post:   Max 100/gün
Giriş:  Max 20/gün
```

### **Katman 3: Cihaz Kontrolü**
```javascript
Max 5 hesap/cihaz
Aynı browser fingerprint = aynı cihaz
```

### **Katman 4: Hesap Yaşı**
```javascript
Yeni hesap (< 1 saat):
  → Sınırlı özellikler
  → Telefon doğrulama önerilir
```

### **Katman 5: Davranış Analizi**
```javascript
Şüpheli paternler:
  - Çok hızlı kayıt
  - Aynı IP'den çoklu hesap
  - Bot benzeri aktivite
→ Otomatik telefon doğrulama iste
```

---

## 🚀 Kullanım

### **Kayıt Sırasında:**
```typescript
import { AntiBotService } from './services/antiBotService';

// Bot kontrolü
const botCheck = await AntiBotService.performBotCheck({
  email: req.body.email,
  ipAddress: req.ip,
  deviceFingerprint: req.body.fingerprint,
  actionType: 'register'
});

if (!botCheck.passed) {
  return res.status(403).json({
    success: false,
    message: 'Registration blocked',
    reasons: botCheck.reasons
  });
}

// IP aktivitesini kaydet
AntiBotService.logIPActivity(req.ip, 'register', userId);
```

### **İmza Atarken:**
```typescript
// Bot kontrolü
const botCheck = await AntiBotService.performBotCheck({
  ipAddress: req.ip,
  userId: req.user.id,
  deviceFingerprint: req.body.fingerprint,
  actionType: 'signature'
});

if (!botCheck.passed) {
  return res.status(403).json({
    success: false,
    message: 'Too many signatures',
    reasons: botCheck.reasons
  });
}

if (botCheck.requiresPhoneVerification) {
  return res.status(403).json({
    success: false,
    message: 'Phone verification required',
    requiresPhone: true
  });
}
```

---

## 📊 İstatistikler

### **Şüpheli Aktivite Takibi:**
```typescript
const stats = AntiBotService.getSuspiciousActivityStats();
// {
//   severity: 'medium',
//   count: 45,
//   unresolved: 12
// }
```

### **IP Engelleme:**
```typescript
// Kalıcı engelleme
AntiBotService.blockIP('1.2.3.4', 'Bot detected');

// Geçici engelleme (24 saat)
AntiBotService.blockIP('1.2.3.4', 'Too many attempts', adminId, 24);
```

---

## 🔮 Gelecek Özellikler

### **Faz 2: Telefon Doğrulama** (Sonraki adım)
- Twilio/Vonage entegrasyonu
- SMS kod gönderme
- Telefon doğrulama UI
- Doğrulanmış hesaplara ✓ rozeti

### **Faz 3: Gelişmiş Analiz**
- Machine learning bot tespiti
- Davranış skorlama
- Anomali tespiti
- Gerçek zamanlı uyarılar

### **Faz 4: Topluluk Moderasyonu**
- Kullanıcı raporları
- Otomatik moderasyon
- Güvenilir kullanıcı sistemi

---

## 💡 Entegrasyon Durumu

### **Backend: ✅ TAMAMLANDI**
1. ✅ `authService.ts` - Bot kontrolü eklendi
2. ✅ `authController.ts` - IP/fingerprint çıkarma
3. ✅ `signatureService.ts` - İmza bot kontrolü
4. ✅ `signatureController.ts` - Telefon doğrulama uyarısı
5. ✅ `campaignService.ts` - Kampanya bot kontrolü
6. ✅ `campaignController.ts` - IP/fingerprint çıkarma
7. ✅ `communityService.ts` - Post bot kontrolü
8. ✅ `communityController.ts` - Telefon doğrulama uyarısı

### **Frontend: ⏳ BEKLEMEDE**
1. ⏳ Device fingerprinting ekle
2. ⏳ Telefon doğrulama UI
3. ⏳ Hata mesajları göster
4. ⏳ "Telefon doğrula" modalı

---

## 🎯 Sonuç

**Mevcut Durum:**
- ✅ Veritabanı hazır (6 tablo)
- ✅ Anti-bot servisi hazır
- ✅ 10 geçici email domain engellendi
- ✅ Backend entegrasyonu TAMAMLANDI
- ⏳ Frontend entegrasyonu gerekli

**Koruma Seviyesi:**
- 🟢 Backend koruması: %100 AKTIF
- 🟡 Frontend entegrasyonu: %0 (device fingerprint yok)
- 🔴 Telefon doğrulama: %0 (UI yok)

**Aktif Korumalar:**
- ✅ Geçici email engelleme
- ✅ IP rate limiting (kayıt: 3/gün, imza: 50/gün)
- ✅ Hesap yaşı kontrolü (< 1 saat = sınırlı)
- ✅ Şüpheli aktivite loglama
- ⏳ Device fingerprinting (frontend gerekli)
- ⏳ Telefon doğrulama (UI gerekli)

**Sonraki Adım:**
1. Frontend'e device fingerprinting ekle (@fingerprintjs/fingerprintjs)
2. Telefon doğrulama UI oluştur
3. Twilio/Vonage entegrasyonu

---

**Durum:** ✅ Backend Entegrasyonu Tamamlandı
**Süre:** Backend: Tamamlandı | Frontend: ~2-3 saat
