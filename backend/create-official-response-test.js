/**
 * Test verisi: Doğrulanmış entity + kampanya + official_response güncelleme
 */
const { Pool } = require('pg');
const { randomBytes } = require('crypto');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

function genId() {
  return randomBytes(16).toString('hex');
}

async function main() {
  // 1. Türk Telekom'u doğrulanmış yap
  const entityId = 'e37adf2a-6a6e-4ae6-be9a-91d52f0c31ec';
  await pool.query('UPDATE entities SET verified = true WHERE id = $1', [entityId]);
  console.log('✅ Türk Telekom doğrulandı (verified = true)');

  // 2. testlogin kullanıcısı
  const userId = 'b8a91fea20697332acdba0116f77076c';

  // 3. Kampanya oluştur (entity_id = Türk Telekom)
  const campaignId = genId();
  const caseNumber = `EQA-2026-${Date.now().toString().slice(-4)}`;
  await pool.query(
    `INSERT INTO campaigns (
      id, creator_id, entity_id, title, description, category,
      status, case_number, demanded_action, standard_reference,
      response_deadline_days, target_entity, target_type, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9,30,$10,'company',NOW())`,
    [
      campaignId,
      userId,
      entityId,
      'Türk Telekom Haksız Fatura Uygulaması',
      'Türk Telekom, sözleşmede belirtilmeyen ek ücretleri faturalara yansıtmaktadır. Binlerce müşteri bu durumdan etkilenmekte olup şikayetler yanıtsız kalmaktadır. Tüketici hakları açıkça ihlal edilmektedir.',
      'Tüketici Hakları',
      caseNumber,
      'Haksız yere alınan ücretlerin iade edilmesi ve sözleşme dışı fatura uygulamasına son verilmesi talep edilmektedir.',
      'Tüketicinin Korunması Hakkında Kanun (6502), Madde 48',
      'Türk Telekom',
    ]
  );
  console.log(`✅ Kampanya oluşturuldu: ID = ${campaignId}`);

  // 4. Birkaç imza ekle (anonim)
  for (let i = 0; i < 3; i++) {
    const sigId = genId();
    await pool.query(
      `INSERT INTO signatures (id, campaign_id, user_id, is_anonymous, created_at)
       VALUES ($1,$2,$3,true,NOW() - interval '${i} days')
       ON CONFLICT DO NOTHING`,
      [sigId, campaignId, userId]
    ).catch(() => {}); // ilk imza zaten varsa atla
  }
  console.log('✅ İmzalar eklendi');

  // 5. Normal bir güncelleme ekle
  await pool.query(
    `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type, created_at)
     VALUES ($1,$2,$3,$4,'update', NOW() - interval '5 days')`,
    [
      campaignId,
      userId,
      'Şikayet Başvurusu Yapıldı',
      'Tüketici Hakem Heyeti\'ne resmi başvuru yapıldı. Başvuru numarası: THH-2026-18742. Sonuç 30 gün içinde bildirilecektir.',
    ]
  );
  console.log('✅ Normal güncelleme eklendi');

  // 6. Durum değişikliği güncelleme
  await pool.query(
    `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type, created_at)
     VALUES ($1,$2,$3,$4,'status_change', NOW() - interval '2 days')`,
    [
      campaignId,
      userId,
      'Durum güncellendi',
      'Durum güncellendi: Yanıt Alındı\nAçıklama: Türk Telekom\'dan resmi yanıt geldi.',
    ]
  );
  console.log('✅ Durum değişikliği güncelleme eklendi');

  // 7. official_response ekle (entity_id ile)
  await pool.query(
    `INSERT INTO campaign_updates (campaign_id, author_id, title, content, source_url, type, entity_id, created_at)
     VALUES ($1,$2,$3,$4,$5,'official_response',$6, NOW() - interval '1 day')`,
    [
      campaignId,
      userId,
      'Türk Telekom Resmi Yanıtı',
      'Değerli müşterilerimizin yaşadığı mağduriyetin farkındayız. Söz konusu fatura hatası teknik bir sistem güncellemesinden kaynaklanmış olup etkilenen tüm müşterilerimize iade işlemi başlatılmıştır. Müşteri hizmetlerimizi arayarak iade talebinizi iletebilirsiniz. Yaşanan aksaklık için özür dileriz.',
      'https://www.turktelekom.com.tr/duyurular/fatura-duzeltme-2026',
      entityId,
    ]
  );
  console.log('✅ official_response güncelleme eklendi');

  console.log('\n🎉 Test verisi hazır!');
  console.log(`📌 Kampanya URL: http://localhost:3000/campaigns/${campaignId}`);
  console.log(`🏢 Entity URL:   http://localhost:3000/entities/turk-telekom`);

  await pool.end();
}

main().catch(e => { console.error('HATA:', e.message); pool.end(); });
