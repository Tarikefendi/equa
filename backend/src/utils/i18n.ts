// Simple i18n utility for backend messages

export const translations = {
  tr: {
    // Auth messages
    'auth.login.success': 'Giriş başarılı',
    'auth.login.failed': 'Giriş başarısız',
    'auth.register.success': 'Kayıt başarılı',
    'auth.unauthorized': 'Yetkisiz erişim',
    
    // Campaign messages
    'campaign.created': 'Kampanya oluşturuldu',
    'campaign.approved': 'Kampanya onaylandı',
    'campaign.rejected': 'Kampanya reddedildi',
    'campaign.not_found': 'Kampanya bulunamadı',
    
    // Notification messages
    'notification.campaign_approved': 'Kampanyanız onaylandı',
    'notification.campaign_rejected': 'Kampanyanız reddedildi',
    'notification.new_comment': 'Yeni yorum',
    'notification.level_up': 'Seviye atladınız',
  },
  en: {
    // Auth messages
    'auth.login.success': 'Login successful',
    'auth.login.failed': 'Login failed',
    'auth.register.success': 'Registration successful',
    'auth.unauthorized': 'Unauthorized access',
    
    // Campaign messages
    'campaign.created': 'Campaign created',
    'campaign.approved': 'Campaign approved',
    'campaign.rejected': 'Campaign rejected',
    'campaign.not_found': 'Campaign not found',
    
    // Notification messages
    'notification.campaign_approved': 'Your campaign was approved',
    'notification.campaign_rejected': 'Your campaign was rejected',
    'notification.new_comment': 'New comment',
    'notification.level_up': 'Level up',
  },
};

export function t(key: string, lang: string = 'tr'): string {
  const langTranslations = translations[lang as keyof typeof translations] || translations.tr;
  return langTranslations[key as keyof typeof langTranslations] || key;
}
