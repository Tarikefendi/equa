const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function test() {
  try {
    // 1) İlk entity'yi bul
    const entityRes = await pool.query('SELECT id, name, slug FROM entities LIMIT 1');
    if (entityRes.rows.length === 0) {
      console.log('❌ Hiç kurum bulunamadı');
      return;
    }
    const entity = entityRes.rows[0];
    console.log(`✅ Test kurumu: ${entity.name} (id: ${entity.id}, slug: ${entity.slug})`);

    // 2) Bu kurumun kampanyalarını say
    const campRes = await pool.query(
      `SELECT status, COUNT(*) FROM campaigns WHERE entity_id = $1 AND status != 'pending' GROUP BY status`,
      [entity.id]
    );
    console.log('📊 Kampanya dağılımı:', campRes.rows);

    // 3) Mevcut transparency score'u kontrol et
    const existing = await pool.query(
      'SELECT * FROM entity_transparency_metrics WHERE entity_id = $1',
      [entity.id]
    );
    if (existing.rows.length > 0) {
      console.log('📈 Mevcut skor:', existing.rows[0]);
    } else {
      console.log('ℹ️  Henüz hesaplanmış skor yok');
    }

    // 4) API endpoint'ini test et
    const fetch = (await import('node-fetch')).default;
    const apiRes = await fetch(`http://localhost:5000/api/v1/entities/${entity.slug}/transparency-score`);
    const apiData = await apiRes.json();
    console.log(`\n🌐 API yanıtı (GET /entities/${entity.slug}/transparency-score):`);
    console.log(JSON.stringify(apiData, null, 2));

    // 5) DB'de kaydedildi mi kontrol et
    const afterCalc = await pool.query(
      'SELECT * FROM entity_transparency_metrics WHERE entity_id = $1',
      [entity.id]
    );
    if (afterCalc.rows.length > 0) {
      console.log('\n✅ DB kaydı doğrulandı:', afterCalc.rows[0]);
    } else {
      console.log('\n⚠️  DB kaydı bulunamadı (kampanya yoksa normal)');
    }

  } catch (err) {
    console.error('❌ Test hatası:', err.message);
  } finally {
    pool.end();
  }
}

test();
