const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  console.log('=== Entity Metrics Test ===\n');

  // 1. Örnek entity bul
  const entity = (await pool.query(
    `SELECT e.id, e.name, e.slug, COUNT(c.id) as campaign_count
     FROM entities e
     LEFT JOIN campaigns c ON c.entity_id = e.id
     GROUP BY e.id, e.name, e.slug
     ORDER BY campaign_count DESC
     LIMIT 1`
  )).rows[0];

  if (!entity) { console.log('❌ Entity bulunamadı'); await pool.end(); return; }
  console.log(`📋 Test entity: "${entity.name}" (${entity.slug})`);
  console.log(`   Kampanya sayısı: ${entity.campaign_count}\n`);

  // 2. Metrikleri hesapla
  const result = await pool.query(`
    SELECT
      COUNT(*) AS campaign_count,
      COUNT(*) FILTER (WHERE status = 'response_received') AS response_count,
      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
      COUNT(*) FILTER (WHERE status = 'no_response') AS no_response_count
    FROM campaigns WHERE entity_id = $1
  `, [entity.id]);

  const row = result.rows[0];
  const campaignCount = parseInt(row.campaign_count) || 0;
  const responseCount = parseInt(row.response_count) || 0;
  const responseRate = campaignCount > 0 ? (responseCount / campaignCount) : 0;

  console.log('📊 Hesaplanan metrikler:');
  console.log(`   campaign_count:    ${campaignCount}`);
  console.log(`   response_count:    ${responseCount}`);
  console.log(`   resolved_count:    ${row.resolved_count}`);
  console.log(`   no_response_count: ${row.no_response_count}`);
  console.log(`   response_rate:     ${(responseRate * 100).toFixed(1)}%`);

  // 3. DB'ye yaz (upsert)
  await pool.query(`
    INSERT INTO entity_metrics
      (entity_id, campaign_count, response_count, resolved_count, no_response_count, response_rate, last_calculated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (entity_id) DO UPDATE SET
      campaign_count = EXCLUDED.campaign_count,
      response_count = EXCLUDED.response_count,
      resolved_count = EXCLUDED.resolved_count,
      no_response_count = EXCLUDED.no_response_count,
      response_rate = EXCLUDED.response_rate,
      last_calculated_at = NOW()
  `, [entity.id, campaignCount, responseCount, row.resolved_count, row.no_response_count, responseRate]);

  // 4. Doğrula
  const saved = (await pool.query(
    'SELECT * FROM entity_metrics WHERE entity_id = $1', [entity.id]
  )).rows[0];

  console.log('\n✅ DB kaydı doğrulandı:');
  console.log(`   metrics_available: ${parseInt(saved.campaign_count) >= 3}`);
  console.log(`   last_calculated_at: ${saved.last_calculated_at}`);
  console.log(`\n🔗 Entity sayfası: http://localhost:3000/entities/${entity.slug}`);

  await pool.end();
}

run().catch(e => { console.error('❌', e.message); pool.end(); });
