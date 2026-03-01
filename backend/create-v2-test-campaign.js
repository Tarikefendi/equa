const Database = require('better-sqlite3');
const { randomBytes } = require('crypto');

const db = new Database('database.sqlite');

// Get test user
const testUser = db.prepare('SELECT id FROM users WHERE email = ?').get('testlogin@example.com');

if (!testUser) {
  console.error('❌ Test user not found. Please create test user first.');
  process.exit(1);
}

console.log('✅ Test user found:', testUser.id);

// Create V2 campaign with all new fields
const campaignId = randomBytes(16).toString('hex');
const now = new Date().toISOString();

const campaign = {
  id: campaignId,
  creator_id: testUser.id,
  title: 'Starbucks - Filistin Desteği ve Sendika Karşıtlığı',
  description: `Starbucks, Filistin'e destek veren çalışanlarını işten çıkarması ve sendikalaşma çabalarını engellemesiyle insan hakları ihlali yapmaktadır. 

Şirket, sosyal medyada Filistin'e destek paylaşan çalışanlarına karşı disiplin cezaları uygulamış, bazı çalışanları işten çıkarmıştır. Ayrıca, ABD'de sendikalaşma çabalarına karşı sistematik bir baskı kampanyası yürütmektedir.

Bu durum, çalışan haklarının ve ifade özgürlüğünün açık ihlalidir. Starbucks'ın kurumsal sosyal sorumluluk iddialarıyla çelişen bu tutum, tüketiciler tarafından sorgulanmalıdır.`,
  target_entity: 'Starbucks Corporation',
  target_type: 'company',
  target_email: 'customerservice@starbucks.com',
  category: 'İnsan Hakları',
  
  // V2 NEW FIELDS
  standard_reference: 'ILO Çalışma Standartları',
  standard_reference_other: null,
  demanded_action: 'Starbucks\'tan talep ediyoruz: 1) Filistin desteği nedeniyle işten çıkarılan tüm çalışanların işe iade edilmesi, 2) Sendikalaşma hakkının tanınması ve sendika karşıtı faaliyetlerin durdurulması, 3) İfade özgürlüğünü kısıtlayan politikaların kaldırılması, 4) Kamuoyuna açık bir özür ve taahhüt açıklaması yapılması.',
  response_deadline_days: 30,
  
  evidence: JSON.stringify({
    links: [
      'https://www.theguardian.com/business/2023/nov/16/starbucks-union-palestine-israel',
      'https://www.bbc.com/news/business-67432055',
      'https://www.aljazeera.com/economy/2023/11/17/starbucks-sues-union-over-pro-palestine-post'
    ]
  }),
  goals: JSON.stringify({}),
  status: 'active',
  created_at: now,
  updated_at: now
};

try {
  const insert = db.prepare(`
    INSERT INTO campaigns (
      id, creator_id, title, description, target_entity, target_type, target_email,
      category, standard_reference, standard_reference_other, demanded_action,
      response_deadline_days, response_deadline_date, evidence, goals, status,
      created_at, updated_at
    ) VALUES (
      @id, @creator_id, @title, @description, @target_entity, @target_type, @target_email,
      @category, @standard_reference, @standard_reference_other, @demanded_action,
      @response_deadline_days, datetime('now', '+' || @response_deadline_days || ' days'),
      @evidence, @goals, @status, @created_at, @updated_at
    )
  `);

  insert.run(campaign);

  console.log('\n✅ V2 Test Campaign Created Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Campaign ID:', campaignId);
  console.log('📌 Title:', campaign.title);
  console.log('🎯 Target:', campaign.target_entity);
  console.log('📂 Category:', campaign.category);
  console.log('\n🆕 V2 FIELDS:');
  console.log('🔎 Standard:', campaign.standard_reference);
  console.log('🎯 Demanded Action:', campaign.demanded_action.substring(0, 80) + '...');
  console.log('⏳ Response Deadline:', campaign.response_deadline_days, 'days');
  console.log('📎 Evidence Links:', JSON.parse(campaign.evidence).links.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🌐 View at: http://localhost:3000/campaigns/' + campaignId);
  console.log('📝 All campaigns: http://localhost:3000/campaigns');

  // Verify the campaign was created with deadline
  const created = db.prepare(`
    SELECT id, title, standard_reference, demanded_action, 
           response_deadline_days, response_deadline_date
    FROM campaigns WHERE id = ?
  `).get(campaignId);

  console.log('\n✅ Verification:');
  console.log('Response Deadline Date:', created.response_deadline_date);

} catch (error) {
  console.error('❌ Error creating campaign:', error.message);
  process.exit(1);
}

db.close();
