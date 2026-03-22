const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function test() {
  try {
    // 1) Kampanya bul
    const campRes = await pool.query("SELECT id, title FROM campaigns WHERE status != 'pending' LIMIT 1");
    if (!campRes.rows.length) { console.log('❌ Kampanya bulunamadı'); return; }
    const campaign = campRes.rows[0];
    console.log(`✅ Test kampanyası: "${campaign.title}"`);

    // 2) Kullanıcı bul
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRes.rows[0].id;

    // 3) Bugün imza ekle
    await pool.query(
      'INSERT INTO signatures (campaign_id, user_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [campaign.id, userId]
    );
    console.log('✅ Test imzası eklendi');

    // 4) Bugün share ekle
    await pool.query(
      'INSERT INTO campaign_shares (campaign_id, user_id, platform, created_at) VALUES ($1, $2, $3, NOW())',
      [campaign.id, userId, 'test']
    );
    console.log('✅ Test paylaşımı eklendi');

    // 5) DB'den doğrula
    const dbRes = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1) AS total_supporters,
        (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_supporters,
        (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1) AS total_shares,
        (SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1 AND created_at >= CURRENT_DATE) AS today_shares`,
      [campaign.id]
    );
    console.log('\n📊 DB metrikleri:', dbRes.rows[0]);

    // 6) API test
    const fetch = (await import('node-fetch')).default;
    const apiRes = await fetch(`http://localhost:5000/api/v1/campaigns/${campaign.id}/momentum`);
    const apiData = await apiRes.json();
    console.log(`\n🌐 API yanıtı:`);
    console.log(JSON.stringify(apiData, null, 2));

    if (apiData.success) {
      console.log('\n✅ Momentum endpoint doğrulandı');
    } else {
      console.log('\n⚠️  Backend restart gerekiyor olabilir');
    }

  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    pool.end();
  }
}

test();
