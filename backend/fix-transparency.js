const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Mevcut durumu göster
  const entities = await pool.query(
    "SELECT id, name, slug FROM entities WHERE name ILIKE '%migros%' OR name ILIKE '%telekom%'"
  );
  console.log('Bulunan kurumlar:', entities.rows);

  for (const entity of entities.rows) {
    // Mevcut transparency metrics
    const existing = await pool.query(
      'SELECT * FROM entity_transparency_metrics WHERE entity_id = $1',
      [entity.id]
    );
    console.log(`\n${entity.name} mevcut metrics:`, existing.rows[0]);

    // Gerçek kampanya verilerini hesapla
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'response_received' OR status = 'resolved' THEN 1 END) as response_received,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_campaigns,
        COUNT(CASE WHEN status = 'no_response' OR status = 'closed_unresolved' THEN 1 END) as ignored_campaigns
      FROM campaigns
      WHERE entity_id = $1
    `, [entity.id]);

    const s = stats.rows[0];
    const total = parseInt(s.total_campaigns) || 0;
    const responded = parseInt(s.response_received) || 0;
    const resolved = parseInt(s.resolved_campaigns) || 0;
    const ignored = parseInt(s.ignored_campaigns) || 0;

    const response_rate = total > 0 ? (responded / total) : 0;
    const resolution_rate = total > 0 ? (resolved / total) : 0;
    const ignore_penalty = total > 0 ? (ignored / total) : 0;
    // speed_score: yanıt süresi bilinmediği için 0.5 (nötr)
    const speed_score = 0.5;
    const score = Math.max(0, Math.min(100,
      (response_rate * 40) + (resolution_rate * 30) + (speed_score * 20) - (ignore_penalty * 10)
    ));

    console.log(`${entity.name} yeni hesaplama:`, { total, responded, resolved, ignored, score: Math.round(score) });

    // Güncelle veya ekle
    await pool.query(`
      INSERT INTO entity_transparency_metrics
        (entity_id, total_campaigns, response_received, resolved_campaigns, ignored_campaigns, average_response_days, transparency_score, last_calculated_at)
      VALUES ($1, $2, $3, $4, $5, NULL, $6, NOW())
      ON CONFLICT (entity_id) DO UPDATE SET
        total_campaigns = $2,
        response_received = $3,
        resolved_campaigns = $4,
        ignored_campaigns = $5,
        average_response_days = NULL,
        transparency_score = $6,
        last_calculated_at = NOW()
    `, [entity.id, total, responded, resolved, ignored, Math.round(score)]);

    console.log(`${entity.name} guncellendi.`);
  }

  await pool.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });
