import nodemailer from 'nodemailer';
import logger from './logger';

// Check if SMTP is configured
const isSmtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS && 
                         process.env.SMTP_USER !== 'your-email@gmail.com';

// Email configuration
let transporter: any;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
} else {
  // Test mode - emails will be logged but not sent
  logger.info('📧 Email system running in SIMULATION MODE (SMTP not configured)');
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (isSmtpConfigured) {
      // Real email sending
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Boycott Platform" <noreply@boycott.com>',
        to,
        subject,
        html,
      });
      logger.info(`✅ Email sent: ${info.messageId}`);
      return info;
    } else {
      // Simulation mode - just log
      logger.info('📧 [SIMULATION] Email would be sent:');
      logger.info(`   To: ${to}`);
      logger.info(`   Subject: ${subject}`);
      logger.info(`   Content: ${html.substring(0, 100)}...`);
      return { messageId: 'simulated-' + Date.now() };
    }
  } catch (error: any) {
    logger.error('Email send error: ' + (error?.message || error));
    logger.error('SMTP details:', { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER });
    throw new Error('Failed to send email');
  }
};

export const sendVerificationEmail = async (email: string, username: string, token: string) => {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/auth/verify-email?token=${token}`;

  const html = `
    <h1>Welcome to Boycott Platform, ${username}!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>Or copy and paste this link into your browser:</p>
    <p>${verificationUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  `;

  await sendEmail(email, 'Verify Your Email - Boycott Platform', html);
};

export const sendPasswordResetEmail = async (email: string, username: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">Şifre Sıfırlama Talebi</h2>
      <p>Merhaba <strong>${username}</strong>,</p>
      <p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1F2A44; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">
        Şifremi Sıfırla
      </a>
      <p style="color: #6b7280; font-size: 13px;">Ya da bu bağlantıyı tarayıcına yapıştır:<br/>${resetUrl}</p>
      <p style="color: #6b7280; font-size: 13px;">Bu bağlantı <strong>1 saat</strong> geçerlidir. Eğer bu talebi sen yapmadıysan bu emaili görmezden gelebilirsin.</p>
    </div>
  `;

  await sendEmail(email, 'Şifre Sıfırlama Talebi — EQUA', html);
};

export const sendCampaignNotificationEmail = async (
  targetEmail: string,
  campaignTitle: string,
  campaignDescription: string,
  signatureCount: number,
  campaignUrl: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">Kampanya Bildirimi</h1>
      <p>Sayın Yetkili,</p>
      <p>Boykot Platform'da sizinle ilgili bir kampanya <strong>${signatureCount}</strong> imzaya ulaştı.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #1f2937; margin-top: 0;">${campaignTitle}</h2>
        <p style="color: #4b5563;">${campaignDescription.substring(0, 300)}${campaignDescription.length > 300 ? '...' : ''}</p>
      </div>

      <p><strong>${signatureCount}</strong> kişi bu kampanyayı imzaladı ve sizden yanıt bekliyor.</p>
      
      <a href="${campaignUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Kampanyayı Görüntüle
      </a>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Bu email Boykot Platform tarafından otomatik olarak gönderilmiştir.<br>
        Kampanya hakkında daha fazla bilgi için yukarıdaki linke tıklayabilirsiniz.
      </p>
    </div>
  `;

  await sendEmail(targetEmail, `Kampanya Bildirimi: ${campaignTitle}`, html);
};
