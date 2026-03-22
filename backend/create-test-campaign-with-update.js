require('dotenv').config();
const { Pool } = require('pg');
const { randomBytes } = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'boykot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1627',
});

async function run() {
  try {
    // Test kullanıcısını bul
    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE email = 'testlogin@example.com' LIMIT 1"
    );

    if (userResult.rows.length === 0) {
      console.log('Test kullanicisi bulunamadi!');
      return;
    }

    const user = userResult.rows[0];
    console.log('Kullanici:', user.email, '| ID:', user.id);

    // Kampanya oluştur
    const campaignId = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO campaigns (
        id, creator_id, title, description, target_entity, target_type,
        category, goals, evidence, status, standard_reference,
        demanded_action, response_deadline_days, response_deadline_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW() + '30 days'::interval)`,
      [
        campaignId,
        user.id,
        'Test Kampanyasi - Otomatik Guncelleme',
        'Bu kampanya otomatik ilk guncelleme ozelligini test etmek icin olusturuldu.',
        'Test Sirketi A.S.',
        'company',
        'Calisma Haklari',
        JSON.stringify({ target_signatures: 1000 }),
        JSON.stringify({}),
        'active',
        'ILO-87',
        'Sirketin calisma kosullarini iyilestirmesi talep edilmektedir.',
        30,
      ]
    );

    console.log('Kampanya olusturuldu! ID:', campaignId);

    // Otomatik ilk güncellemeyi ekle
    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content)
       VALUES ($1, $2, $3, $4)`,
      [campaignId, user.id, 'Kampanya baslatildi', 'Bu kampanya kamuoyu destegi toplamak icin baslatildi.']
    );

    console.log('Otomatik ilk guncelleme eklendi!');

    // Kontrol et
    const updates = await pool.query(
      'SELECT * FROM campaign_updates WHERE campaign_id = $1',
      [campaignId]
    );

    console.log('\nKampanya guncellemeleri:');
    console.log(JSON.stringify(updates.rows, null, 2));

    console.log('\nKampanya URL: http://localhost:3000/campaigns/' + campaignId);

  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

run();
