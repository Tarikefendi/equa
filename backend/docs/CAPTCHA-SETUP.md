# Google reCAPTCHA v3 Kurulum Rehberi

## 🔐 reCAPTCHA Nedir?

Google reCAPTCHA v3, kullanıcı deneyimini bozmadan bot saldırılarını engelleyen görünmez bir güvenlik sistemidir. Kullanıcıların davranışlarını analiz ederek 0.0 (bot) ile 1.0 (insan) arasında bir skor verir.

## 📋 Kurulum Adımları

### 1. Google reCAPTCHA Anahtarları Alın

1. [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create) adresine gidin
2. "Register a new site" formunu doldurun:
   - **Label:** Boycott Platform (veya istediğiniz isim)
   - **reCAPTCHA type:** reCAPTCHA v3
   - **Domains:** 
     - `localhost` (development için)
     - `yourdomain.com` (production için)
3. "Submit" butonuna tıklayın
4. İki anahtar alacaksınız:
   - **Site Key** (Frontend için - public)
   - **Secret Key** (Backend için - private)

### 2. Backend Konfigürasyonu

`backend/.env` dosyasına ekleyin:

```env
# Google reCAPTCHA v3
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_MIN_SCORE=0.5
```

**Not:** 
- `RECAPTCHA_MIN_SCORE`: Minimum kabul edilebilir skor (0.0-1.0)
  - 0.5: Orta seviye güvenlik (önerilen)
  - 0.7: Yüksek güvenlik (bazı gerçek kullanıcıları engelleyebilir)
  - 0.3: Düşük güvenlik (daha fazla bot geçebilir)

### 3. Frontend Konfigürasyonu

`frontend/.env.local` dosyasına ekleyin:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

### 4. Sunucuları Yeniden Başlatın

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## 🧪 Test Etme

### Development Modunda Test

Eğer CAPTCHA anahtarları yapılandırılmamışsa:
- Backend: CAPTCHA doğrulaması atlanır (warning log'u ile)
- Frontend: reCAPTCHA script'i yüklenmez

### Production Modunda Test

1. Kayıt sayfasına gidin: `http://localhost:3000/auth/register`
2. Formu doldurun ve "Kayıt Ol" butonuna tıklayın
3. reCAPTCHA otomatik olarak çalışacak (görünmez)
4. Backend log'larında CAPTCHA skorunu görebilirsiniz

### CAPTCHA Skorlarını İzleme

Backend log'larında şu mesajları göreceksiniz:

```
✅ CAPTCHA verified successfully: score 0.9, action register
⚠️ CAPTCHA score too low: 0.3 (min: 0.5)
❌ CAPTCHA verification failed
```

## 🔧 Sorun Giderme

### "CAPTCHA verification skipped" Uyarısı

**Sebep:** `RECAPTCHA_SECRET_KEY` yapılandırılmamış

**Çözüm:** Backend `.env` dosyasına secret key ekleyin

### "reCAPTCHA site key not configured" Uyarısı

**Sebep:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` yapılandırılmamış

**Çözüm:** Frontend `.env.local` dosyasına site key ekleyin

### CAPTCHA Skoru Çok Düşük

**Sebep:** Kullanıcı davranışı bot gibi algılanıyor

**Çözümler:**
1. `RECAPTCHA_MIN_SCORE` değerini düşürün (örn: 0.3)
2. Kullanıcıdan sayfada biraz gezinmesini isteyin
3. Test için farklı bir tarayıcı/cihaz kullanın

### CAPTCHA Token Geçersiz

**Sebep:** Token süresi dolmuş (2 dakika)

**Çözüm:** Kullanıcı formu göndermeden önce yeni token alınıyor (otomatik)

## 🎯 Hangi Endpoint'ler Korunuyor?

Şu anda CAPTCHA koruması aktif olan endpoint'ler:

- ✅ `POST /api/v1/auth/register` - Kayıt
- ✅ `POST /api/v1/auth/login` - Giriş

### Daha Fazla Endpoint Eklemek

Herhangi bir route'a CAPTCHA eklemek için:

```typescript
import { verifyCaptcha } from '../middleware/captcha';

router.post('/your-endpoint', 
  verifyCaptcha('your_action_name'), 
  yourController
);
```

## 📊 Best Practices

1. **Minimum Skor:** 0.5 ile başlayın, ihtiyaca göre ayarlayın
2. **Action Names:** Her endpoint için benzersiz action kullanın
3. **Monitoring:** CAPTCHA skorlarını düzenli olarak izleyin
4. **User Experience:** Gerçek kullanıcıları engellememeye dikkat edin
5. **Rate Limiting:** CAPTCHA ile birlikte rate limiting kullanın

## 🔒 Güvenlik Notları

- ✅ Secret key'i asla frontend'de kullanmayın
- ✅ Secret key'i git'e commit etmeyin
- ✅ Production'da mutlaka CAPTCHA kullanın
- ✅ HTTPS kullanın (production'da zorunlu)
- ✅ Domain whitelist'ini güncel tutun

## 📚 Kaynaklar

- [Google reCAPTCHA v3 Docs](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Best Practices Guide](https://developers.google.com/recaptcha/docs/v3#best_practices)

