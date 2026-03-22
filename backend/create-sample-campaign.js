const { Pool } = require('pg');
const { randomBytes } = require('crypto');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'equa_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function run() {
  const client = await pool.connect();
  try {
    // Test kullanıcısını bul
    const userRes = await client.query(
      `SELECT id FROM users WHERE email = 'testlogin@example.com' LIMIT 1`
    );
    if (!userRes.rows.length) {
      console.error('❌ Test kullanıcısı bulunamadı. Önce create-test-user.js çalıştırın.');
      process.exit(1);
    }
    const userId = userRes.rows[0].id;
    console.log('✅ Kullanıcı bulundu:', userId);

    // Case number üret
    const seqRes = await client.query(`SELECT nextval('campaign_case_seq') as n`);
    const year = new Date().getFullYear();
    const num = String(seqRes.rows[0].n).padStart(6, '0');
    const caseNumber = `EQUA-${year}-${num}`;

    const campaignId = randomBytes(16).toString('hex');

    const evidence = JSON.stringify({
      links: [
        'https://www.bbc.com/turkce/haberler-dunya-65432055',
        'https://www.theguardian.com/environment/2024/jan/10/plastic-pollution-report',
      ],
    });

    const goals = JSON.stringify({});

    const deadlineDays = 30;

    await client.query(
      `INSERT INTO campaigns (
        id, creator_id, title, description, target_entity, target_type, target_email,
        category, standard_reference, standard_reference_other, demanded_action,
        response_deadline_days, response_deadline_date,
        evidence, goals, status, case_number
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, NOW() + INTERVAL '30 days',
        $13, $14, 'active', $15
      )`,
      [
        campaignId,
        userId,
        'Plastik Ambalaj Kirliliğine Son — Büyük Market Zincirleri Harekete Geçmeli',
        `Türkiye'nin önde gelen market zincirleri, gereksiz plastik ambalaj kullanımını sürdürerek çevre kirliliğine doğrudan katkıda bulunmaktadır.

Yapılan araştırmalar, büyük market zincirlerinin yıllık plastik ambalaj atığının %40'ından fazlasını oluşturduğunu ortaya koymaktadır. Meyve ve sebzeler tek kullanımlık plastik torbalar içinde satılmakta, ürünler gereksiz yere çok katmanlı ambalajlarla paketlenmektedir.

AB ülkelerinde bu uygulamalar yasal düzenlemelerle kısıtlanmış olmasına karşın, Türkiye'deki büyük zincirler gönüllü dönüşüm taahhütlerini yerine getirmemektedir. Tüketiciler olarak bu durumu kabul etmiyoruz.`,
        'Migros Ticaret A.Ş.',
        'company',
        'musteri.hizmetleri@migros.com.tr',
        'Çevre',
        'BM Sürdürülebilir Kalkınma Hedefleri (SDG 12 — Sorumlu Üretim ve Tüketim)',
        null,
        `Migros'tan talep ediyoruz:
1. 2026 yılı sonuna kadar meyve-sebze bölümlerinde tek kullanımlık plastik torba kullanımının tamamen kaldırılması.
2. Kendi markalı ürünlerde geri dönüştürülebilir veya biyobozunur ambalaja geçiş takviminin kamuoyuyla paylaşılması.
3. Mağazalarda doldurma istasyonları (refill) kurulması için pilot uygulama başlatılması.
4. Yıllık plastik azaltım raporunun bağımsız denetimle yayımlanması.`,
        deadlineDays,
        evidence,
        goals,
        caseNumber,
      ]
    );

    // Otomatik ilk güncelleme
    await client.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content)
       VALUES ($1, $2, $3, $4)`,
      [
        campaignId,
        userId,
        'Kampanya başlatıldı',
        'Bu kampanya plastik ambalaj kirliliğine dikkat çekmek ve büyük market zincirlerini harekete geçirmek amacıyla başlatılmıştır.',
      ]
    );

    console.log('\n✅ Örnek kampanya oluşturuldu!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Kampanya ID :', campaignId);
    console.log('🗂  Dosya No    :', caseNumber);
    console.log('📌 Başlık      : Plastik Ambalaj Kirliliğine Son');
    console.log('🎯 Hedef       : Migros Ticaret A.Ş.');
    console.log('📂 Kategori    : Çevre');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 http://localhost:3000/campaigns/' + campaignId);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
