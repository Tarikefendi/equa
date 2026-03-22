const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function test() {
  try {
    // 1) Test için active kampanya bul
    const campRes = await pool.query(
      "SELECT id, title, status FROM campaigns WHERE status = 'active' LIMIT 1"
    );
    if (campRes.rows.length === 0) {
      console.log('❌ Active kampanya bulunamadı');
      return;
    }
    const campaign = campRes.rows[0];
    console.log(`✅ Test kampanyası: "${campaign.title}" (${campaign.id})`);

    // 2) İmza sayısını kontrol et
    const sigRes = await pool.query(
      'SELECT COUNT(*) AS cnt FROM signatures WHERE campaign_id = $1',
      [campaign.id]
    );
    console.log(`📊 Mevcut imza sayısı: ${sigRes.rows[0].cnt}`);

    // 3) Kampanyayı resolved yap + victory alanlarını set et
    await pool.query(
      `UPDATE campaigns
       SET status = 'resolved',
           victory_at = NOW(),
           victory_support_count = (SELECT COUNT(*) FROM signatures WHERE campaign_id = $1),
           last_activity_at = NOW()
       WHERE id = $1`,
      [campaign.id]
    );
    console.log('✅ Kampanya resolved yapıldı, victory alanları set edildi');

    // 4) DB'de doğrula
    const check = await pool.query(
      'SELECT status, victory_at, victory_support_count FROM campaigns WHERE id = $1',
      [campaign.id]
    );
    console.log('📋 DB kaydı:', check.rows[0]);

    // 5) API endpoint'ini test et
    const fetch = (await import('node-fetch')).default;
    const apiRes = await fetch(`http://localhost:5000/api/v1/campaigns/${campaign.id}/victory`);
    const apiData = await apiRes.json();
    console.log(`\n🌐 API yanıtı (GET /campaigns/${campaign.id}/victory):`);
    console.log(JSON.stringify(apiData, null, 2));

    if (apiData.data?.is_victory) {
      console.log('\n✅ Victory endpoint doğrulandı');
    } else {
      console.log('\n⚠️  Victory endpoint is_victory=false döndü — backend restart gerekiyor olabilir');
    }

  } catch (err) {
    console.error('❌ Test hatası:', err.message);
  } finally {
    pool.end();
  }
}

test();
