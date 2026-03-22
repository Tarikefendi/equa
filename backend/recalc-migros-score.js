const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const entityId = 'c614766d-6a3b-477e-bd3c-4ac650bc27f9';

  const res = await pool.query(
    `SELECT
      COUNT(*) AS total_campaigns,
      COUNT(*) FILTER (WHERE status IN ('response_received', 'resolved')) AS response_received,
      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_campaigns,
      COUNT(*) FILTER (WHERE status IN ('no_response', 'closed_unresolved')) AS ignored_campaigns,
      AVG(
        CASE
          WHEN status IN ('response_received', 'resolved') AND created_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
        END
      ) AS avg_response_days
     FROM campaigns
     WHERE entity_id = $1 AND status != 'pending'`,
    [entityId]
  );

  const row = res.rows[0];
  const total = parseInt(row.total_campaigns) || 0;
  const responseReceived = parseInt(row.response_received) || 0;
  const resolved = parseInt(row.resolved_campaigns) || 0;
  const ignored = parseInt(row.ignored_campaigns) || 0;
  const avgDays = row.avg_response_days ? Math.round(parseFloat(row.avg_response_days)) : null;

  const responseRate = total > 0 ? responseReceived / total : 0;
  const resolutionRate = total > 0 ? resolved / total : 0;

  let speedScore = 0;
  if (avgDays !== null) {
    if (avgDays <= 3) speedScore = 100;
    else if (avgDays <= 7) speedScore = 80;
    else if (avgDays <= 14) speedScore = 60;
    else if (avgDays <= 30) speedScore = 40;
    else speedScore = 20;
  }

  const ignorePenalty = total > 0 ? ignored / total : 0;
  const score = Math.round(
    (responseRate * 40) + (resolutionRate * 30) + (speedScore * 0.20) - (ignorePenalty * 10)
  );
  const finalScore = Math.max(0, Math.min(100, score));

  console.log('📊 Ham metrikler:');
  console.log(`  Toplam: ${total}, Yanıt: ${responseReceived}, Çözülen: ${resolved}, Yanıtsız: ${ignored}`);
  console.log(`  Ort. yanıt süresi: ${avgDays} gün, Hız skoru: ${speedScore}`);
  console.log(`  response_rate: ${(responseRate*100).toFixed(1)}%, resolution_rate: ${(resolutionRate*100).toFixed(1)}%`);
  console.log(`  ignore_penalty: ${(ignorePenalty*100).toFixed(1)}%`);
  console.log(`\n🎯 Hesaplanan skor: ${finalScore} / 100`);

  // DB'yi güncelle
  await pool.query(
    `INSERT INTO entity_transparency_metrics
       (entity_id, total_campaigns, response_received, resolved_campaigns, ignored_campaigns, average_response_days, transparency_score, last_calculated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (entity_id) DO UPDATE SET
       total_campaigns = $2, response_received = $3, resolved_campaigns = $4,
       ignored_campaigns = $5, average_response_days = $6, transparency_score = $7, last_calculated_at = NOW()`,
    [entityId, total, responseReceived, resolved, ignored, avgDays, finalScore]
  );
  console.log('✅ DB güncellendi');

  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
