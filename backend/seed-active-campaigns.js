const { Pool } = require('pg');
const { randomBytes } = require('crypto');

const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const CREATOR_ID = 'b8a91fea20697332acdba0116f77076c';

const campaigns = [
  {
    title: 'Türk Telekom Haksız Fatura Uygulaması',
    description: 'Türk Telekom müşterilerine sözleşme dışı ek ücretler yansıtmakta ve faturalarda şeffaflık sağlamamaktadır. Bu durum tüketici haklarını açıkça ihlal etmektedir.',
    target_entity: 'Türk Telekom',
    target_type: 'company',
    category: 'Tüketici Hakları',
    standard_reference: 'Tüketici Koruma Kanunu',
    demanded_action: 'Haksız ücretlerin iadesi ve fatura şeffaflığının sağlanması',
    entity_id: 'e37adf2a-6a6e-4ae6-be9a-91d52f0c31ec',
  },
  {
    title: 'Migros Çalışan Hakları İhlali',
    description: 'Migros market çalışanları fazla mesai ücretlerini alamamakta, yasal izin haklarından yararlanamamaktadır. Sendika kurma girişimleri engellenmektedir.',
    target_entity: 'Migros',
    target_type: 'company',
    category: 'Çalışma Hakları',
    standard_reference: 'ILO-87',
    demanded_action: 'Fazla mesai ödemelerinin yapılması ve sendika hakkının tanınması',
    entity_id: 'c614766d-6a3b-477e-bd3c-4ac650bc27f9',
  },
  {
    title: 'Sağlık Bakanlığı İlaç Erişim Sorunu',
    description: 'Kronik hastalıklar için hayati önem taşıyan ilaçlar SGK kapsamından çıkarılmış, hastalar yüksek maliyetlerle karşı karşıya kalmaktadır.',
    target_entity: 'Sağlık Bakanlığı',
    target_type: 'government',
    category: 'Sağlık',
    standard_reference: 'İnsan Hakları Evrensel Beyannamesi',
    demanded_action: 'İlaçların SGK kapsamına alınması ve erişimin kolaylaştırılması',
    entity_id: 'e833cf75-654d-4e84-9e06-7a557f81061b',
  },
  {
    title: 'Çevre Bakanlığı Orman Tahribatı',
    description: 'Kuzey ormanlarında yapılaşmaya izin verilmesi ekolojik dengeyi bozmakta, su havzaları tehdit altına girmektedir.',
    target_entity: 'Çevre ve Şehircilik Bakanlığı',
    target_type: 'government',
    category: 'Çevre',
    standard_reference: 'Aarhus Sözleşmesi',
    demanded_action: 'Orman alanlarındaki yapılaşma izinlerinin iptali',
    entity_id: 'ef438c82-a5d8-4d67-95c0-a9377b3e3a28',
  },
  {
    title: 'Migros Plastik Ambalaj Azaltma Talebi',
    description: 'Migros marketlerde aşırı plastik ambalaj kullanımı çevre kirliliğine yol açmaktadır. Geri dönüşüm oranları yetersiz kalmaktadır.',
    target_entity: 'Migros',
    target_type: 'company',
    category: 'Çevre',
    standard_reference: 'Paris Anlaşması',
    demanded_action: 'Plastik ambalaj kullanımının yüzde elli azaltılması ve geri dönüşüm sisteminin kurulması',
    entity_id: 'c614766d-6a3b-477e-bd3c-4ac650bc27f9',
  },
];

async function run() {
  for (const c of campaigns) {
    const id = randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO campaigns (id, creator_id, title, description, target_entity, target_type, category, status, standard_reference, demanded_action, response_deadline_days, response_deadline_date, visibility, last_activity_at, goals, evidence, entity_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9,30,NOW()+INTERVAL '30 days','public',NOW(),'{}','{}',$10)`,
      [id, CREATOR_ID, c.title, c.description, c.target_entity, c.target_type, c.category, c.standard_reference, c.demanded_action, c.entity_id]
    );
    console.log(`✅ ${c.title}`);
  }
  console.log('\n5 aktif kampanya oluşturuldu.');
  await pool.end();
}

run().catch(console.error);
