const Database = require('better-sqlite3');
const { randomBytes } = require('crypto');

const db = new Database('./database.sqlite');

// Test kampanyası oluştur
const campaignId = randomBytes(16).toString('hex');
const userId = '7c75a8c823f4fc6050203323aa5517a6'; // demo@boycott.com

const insertCampaign = db.prepare(`
  INSERT INTO campaigns (id, creator_id, title, description, target_entity, target_type, category, status, country, city)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  insertCampaign.run(
    campaignId,
    userId,
    'İstanbul Starbucks Boykotu',
    'İstanbul\'daki Starbucks mağazalarını boykot ediyoruz. Filistin\'e destek için sesimizi yükseltelim.',
    'Starbucks',
    'company',
    'İnsan Hakları',
    'active',
    'Türkiye',
    'İstanbul'
  );

  console.log('✅ Test kampanyası oluşturuldu:', campaignId);
  console.log('🌍 Ülke: Türkiye');
  console.log('🏙️ Şehir: İstanbul');

  // Başka bir kampanya da ekleyelim
  const campaignId2 = randomBytes(16).toString('hex');
  insertCampaign.run(
    campaignId2,
    userId,
    'Berlin McDonald\'s Boykotu',
    'Berlin\'deki McDonald\'s restoranlarını boykot ediyoruz.',
    'McDonald\'s',
    'company',
    'Çevre',
    'active',
    'Almanya',
    'Berlin'
  );

  console.log('✅ İkinci test kampanyası oluşturuldu:', campaignId2);
  console.log('🌍 Ülke: Almanya');
  console.log('🏙️ Şehir: Berlin');

} catch (error) {
  console.error('❌ Hata:', error.message);
}

db.close();