# Email Entegrasyonu - SMTP Kurulum Rehberi

## 📧 Genel Bakış

Platform, bildirim tercihlerine göre kullanıcılara email gönderebilir. Email gönderimi için SMTP yapılandırması gereklidir.

---

## 🔧 SMTP Yapılandırması

### 1. Environment Variables

`.env` dosyanıza aşağıdaki değişkenleri ekleyin:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@boykotplatform.com
EMAIL_FROM_NAME=Boykot Platform
```

### 2. Gmail Kullanımı

Gmail kullanıyorsanız:

1. Google hesabınıza gidin
2. Güvenlik > 2 Adımlı Doğrulama'yı aktifleştirin
3. Uygulama Şifreleri bölümüne gidin
4. "Diğer" seçeneğini seçin ve "Boykot Platform" yazın
5. Oluşturulan şifreyi `SMTP_PASS` olarak kullanın

**Ayarlar:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
```

### 3. Outlook/Hotmail Kullanımı

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### 4. SendGrid Kullanımı (Önerilen - Production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### 5. AWS SES Kullanımı (Önerilen - Production)

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

---

## 📝 Email Service Güncelleme

`backend/src/config/email.ts` dosyasını güncelleyin:

```typescript
import nodemailer from 'nodemailer';
import logger from './logger';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    logger.error('SMTP connection error:', error);
  } else {
    logger.info('✅ SMTP server is ready to send emails');
  }
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send error:', error);
    throw error;
  }
};

export default transporter;
```

---

## 📧 Email Template'leri

### 1. Kampanya Onaylandı

```typescript
const campaignApprovedTemplate = (campaignTitle: string, campaignUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Kampanyanız Onaylandı!</h1>
    </div>
    <div class="content">
      <p>Merhaba,</p>
      <p><strong>"${campaignTitle}"</strong> kampanyanız incelendi ve onaylandı!</p>
      <p>Kampanyanız artık platformda yayında ve kullanıcılar tarafından görülebilir.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${campaignUrl}" class="button">Kampanyayı Görüntüle</a>
      </p>
      <p>Başarılar dileriz!</p>
      <p>Boykot Platform Ekibi</p>
    </div>
  </div>
</body>
</html>
`;
```

### 2. Yeni Yorum Bildirimi

```typescript
const newCommentTemplate = (campaignTitle: string, commenterName: string, comment: string, campaignUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .comment { background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 Yeni Yorum</h1>
    </div>
    <div class="content">
      <p>Merhaba,</p>
      <p><strong>${commenterName}</strong> kampanyanıza yorum yaptı:</p>
      <div class="comment">
        <p><strong>"${campaignTitle}"</strong></p>
        <p>${comment}</p>
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${campaignUrl}" class="button">Yorumu Görüntüle</a>
      </p>
      <p>Boykot Platform</p>
    </div>
  </div>
</body>
</html>
`;
```

### 3. Avukat Onaylandı

```typescript
const lawyerVerifiedTemplate = (lawyerName: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚖️ Avukat Kaydınız Onaylandı!</h1>
    </div>
    <div class="content">
      <p>Sayın ${lawyerName},</p>
      <p>Avukat kaydınız incelendi ve onaylandı!</p>
      <p>Artık platformda doğrulanmış avukat olarak görünüyorsunuz ve kampanyalara hukuki destek sağlayabilirsiniz.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3000/lawyers" class="button">Avukat Profilime Git</a>
      </p>
      <p>Başarılar dileriz!</p>
      <p>Boykot Platform Ekibi</p>
    </div>
  </div>
</body>
</html>
`;
```

---

## 🔄 NotificationService Entegrasyonu

`backend/src/services/notificationService.ts` dosyasını güncelleyin:

```typescript
import { sendEmail } from '../config/email';

async createNotification(data: CreateNotificationDTO) {
  // Check preferences
  const shouldReceive = await this.preferencesService.shouldReceiveNotification(
    data.user_id,
    data.type
  );

  if (!shouldReceive) {
    return null;
  }

  // Create in-app notification
  const notification = db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(/* ... */);

  // Send email if user has email notifications enabled
  const user = db.prepare('SELECT email, username FROM users WHERE id = ?').get(data.user_id);
  
  if (user && process.env.SMTP_HOST) {
    try {
      await sendEmail({
        to: user.email,
        subject: data.title,
        html: this.getEmailTemplate(data.type, data, user),
      });
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      // Don't fail the notification creation if email fails
    }
  }

  return notification;
}
```

---

## ✅ Test Etme

### 1. SMTP Bağlantısını Test Et

```bash
cd backend
npm run dev
```

Logları kontrol edin:
- ✅ `SMTP server is ready to send emails` - Başarılı
- ❌ `SMTP connection error` - Hata var

### 2. Test Email Gönder

```typescript
// backend/test-email.ts
import { sendEmail } from './src/config/email';

sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test</h1><p>Email çalışıyor!</p>',
}).then(() => {
  console.log('Email sent successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('Email failed:', error);
  process.exit(1);
});
```

Çalıştır:
```bash
npx ts-node test-email.ts
```

---

## 🚀 Production Önerileri

1. **SendGrid veya AWS SES kullanın** - Daha güvenilir ve ölçeklenebilir
2. **Email queue sistemi** - Bull veya RabbitMQ ile asenkron gönderim
3. **Rate limiting** - Spam önleme
4. **Email tracking** - Açılma ve tıklama takibi
5. **Unsubscribe link** - Her emailde abonelik iptali linki
6. **DKIM/SPF/DMARC** - Email doğrulama
7. **Template engine** - Handlebars veya EJS ile dinamik template'ler

---

## 📚 Kaynaklar

- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid Node.js Guide](https://docs.sendgrid.com/for-developers/sending-email/nodejs)
- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

## ⚠️ Önemli Notlar

1. **Gmail Limitleri:** Günde 500 email (ücretsiz hesap)
2. **Production:** Mutlaka profesyonel SMTP servisi kullanın
3. **Spam:** SPF, DKIM, DMARC kayıtlarını yapılandırın
4. **Privacy:** GDPR uyumlu olun, unsubscribe seçeneği sunun
5. **Testing:** Development'ta Mailtrap veya MailHog kullanın

---

**Durum:** 📝 Dokümantasyon Hazır  
**Kurulum Süresi:** ~30 dakika  
**Zorluk:** Orta

Email entegrasyonu opsiyoneldir. Platform email olmadan da tam fonksiyonel çalışır (sadece in-app bildirimler).
