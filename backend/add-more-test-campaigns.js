const Database = require('better-sqlite3');
const { randomBytes } = require('crypto');

const db = new Database('./database.sqlite');

// Mevcut user ID'yi kullan
const userId = '7c75a8c823f4fc6050203323aa5517a6'; // demo@boycott.com

const campaigns = [
  {
    title: 'Paris Nike Boykotu',
    description: 'Paris\'teki Nike mağazalarını boykot ediyoruz. İşçi hakları için mücadele.',
    target_entity: 'Nike',
    target_type: 'company',
    category: 'İnsan Hakları',
    country: 'Fransa',
    city: 'Paris'
  },
  {
    title: 'London Zara Boykotu',
    description: 'London\'daki Zara mağazalarını boykot ediyoruz. Fast fashion\'a hayır.',
    target_entity: 'Zara',
    target_type: 'company',
    category: 'Çevre',
    country: 'İngiltere',
    city: 'London'
  },
  {
    title: 'New York Amazon Boykotu',
    description: 'New York\'taki Amazon tesislerini boykot ediyoruz. İşçi hakları için.',
    target_entity: 'Amazon',
    target_type: 'company',
    category: 'İnsan Hakları',
    country: 'ABD',
    city: 'New York'
  },
  {
    title: 'Toronto Nestle Boykotu',
    description: 'Toronto\'daki Nestle ürünlerini boykot ediyoruz. Su hakları için.',
    target_entity: 'Nestle',
    target_type: 'company',
    category: 'Çevre',
    country: 'Kanada',
    city: 'Toronto'
  },
  {
    title: 'Ankara Shell Boykotu',
    description: 'Ankara\'daki Shell istasyonlarını boykot ediyoruz. Çevre için.',
    target_entity: 'Shell',
    target_type: 'company',
    category: 'Çevre',
    country: 'Türkiye',
    city: 'Ankara'
  },
  {
    title: 'İzmir Coca Cola Boykotu',
    description: 'İzmir\'deki Coca Cola ürünlerini boykot ediyoruz. Sağlık için.',
    target_entity: 'Coca Cola',
    target_type: 'company',
    category: 'Sağlık',
    country: 'Türkiye',
    city: 'İzmir'
  },
  {
    title: 'Hamburg H&M Boykotu',
    description: 'Hamburg\'daki H&M mağazalarını boykot ediyoruz. Sürdürülebilirlik için.',
    target_entity: 'H&M',
    target_type: 'company',
    category: 'Çevre',
    country: 'Almanya',
    city: 'Hamburg'
  },
  {
    title: 'Madrid Inditex Boykotu',
    description: 'Madrid\'deki Inditex mağazalarını boykot ediyoruz. İşçi hakları için.',
    target_entity: 'Inditex',
    target_type: 'company',
    category: 'İnsan Hakları',
    country: 'İspanya',
    city: 'Madrid'
  }
];

const insertCampaign = db.prepare(`
  INSERT INTO campaigns (id, creator_id, title, description, target_entity, target_type, category, status, country, city)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

console.log('🚀 Daha fazla test kampanyası ekleniyor...\n');

campaigns.forEach((campaign, index) => {
  try {
    const campaignId = randomBytes(16).toString('hex');
    
    insertCampaign.run(
      campaignId,
      userId,
      campaign.title,
      campaign.description,
      campaign.target_entity,
      campaign.target_type,
      campaign.category,
      'active',
      campaign.country,
      campaign.city
    );

    console.log(`✅ ${index + 1}. ${campaign.title}`);
    console.log(`   🌍 ${campaign.country} - ${campaign.city}`);
    console.log(`   🎯 ${campaign.target_entity} (${campaign.category})\n`);
    
  } catch (error) {
    console.error(`❌ Hata (${campaign.title}):`, error.message);
  }
});

console.log('🎉 Test kampanyaları eklendi!');
console.log('\nŞimdi filtrelerde şunlar görünecek:');
console.log('🇹🇷 Türkiye: İstanbul, Ankara, İzmir');
console.log('🇩🇪 Almanya: Berlin, Hamburg');
console.log('🇫🇷 Fransa: Paris');
console.log('🇬🇧 İngiltere: London');
console.log('🇺🇸 ABD: New York');
console.log('🇨🇦 Kanada: Toronto');
console.log('🇪🇸 İspanya: Madrid');

db.close();