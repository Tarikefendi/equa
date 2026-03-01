const fetch = require('node-fetch');

// Get your campaign ID from the database
const CAMPAIGN_ID = 'fec611331c3e36b37be627ca1d9b0fb3'; // EEEEEEEEEE campaign

const testData = {
  campaign_id: CAMPAIGN_ID,
  organization_name: 'EEEEEEEEEE Kuruluşu',
  organization_email: 'info@eeeeeeeeee.com',
  response_text: `Sayın Kampanya Başlatıcısı,

Kampanyanızı dikkatle inceledik ve toplumsal duyarlılığınızı takdir ediyoruz.

Bu konuda şu adımları atmayı planlıyoruz:
1. İç denetim süreci başlatıldı
2. İlgili departmanlarla toplantılar yapılacak
3. 30 gün içinde detaylı bir rapor yayınlanacak

Şeffaflık ve hesap verebilirlik ilkelerimiz doğrultusunda, gelişmelerden sizi bilgilendireceğiz.

Saygılarımızla,
EEEEEEEEEE Kuruluşu Halkla İlişkiler Departmanı`,
  response_type: 'official',
  contact_person: 'Ahmet Yılmaz - Halkla İlişkiler Müdürü'
};

async function createResponse() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/organization-responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Organization response created successfully!');
      console.log('Response ID:', data.data.id);
    } else {
      console.log('❌ Failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createResponse();
