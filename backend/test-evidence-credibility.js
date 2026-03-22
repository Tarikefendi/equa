const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Get a campaign and user
  const campaignRes = await pool.query("SELECT id, creator_id FROM campaigns WHERE status = 'active' LIMIT 1");
  const campaign = campaignRes.rows[0];
  if (!campaign) { console.log('Aktif kampanya bulunamadı'); pool.end(); return; }

  const userRes = await pool.query("SELECT id FROM users WHERE email = 'testlogin@example.com'");
  const userId = userRes.rows[0].id;

  console.log('Campaign:', campaign.id, '| User:', userId);

  // 1. Create sample evidence
  const ev = await pool.query(
    `INSERT INTO campaign_evidence (campaign_id, type, title, url, added_by, status, credibility_type)
     VALUES ($1, 'link', 'Test Kanıt - Haber', 'https://example.com/news', $2, 'pending', 'news_source')
     RETURNING *`,
    [campaign.id, userId]
  );
  const evidenceId = ev.rows[0].id;
  console.log('1. Kanıt oluşturuldu:', evidenceId, '| credibility_type:', ev.rows[0].credibility_type, '| status:', ev.rows[0].status);

  // 2. Approve evidence
  const approved = await pool.query(
    `UPDATE campaign_evidence SET status = 'approved' WHERE id = $1 RETURNING status`,
    [evidenceId]
  );
  console.log('2. Kanıt onaylandı:', approved.rows[0].status);

  // 3. Flag evidence (simulate 3 flags)
  await pool.query(`UPDATE campaign_evidence SET flag_count = 3, status = 'flagged' WHERE id = $1`, [evidenceId]);
  const flagged = await pool.query(`SELECT status, flag_count FROM campaign_evidence WHERE id = $1`, [evidenceId]);
  console.log('3. Kanıt işaretlendi:', flagged.rows[0]);

  // 4. Evidence summary
  const summary = await pool.query(
    `SELECT
      COUNT(*) AS total_evidence,
      COUNT(*) FILTER (WHERE status = 'approved') AS verified_evidence,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending_review,
      COUNT(*) FILTER (WHERE status = 'flagged') AS flagged
     FROM campaign_evidence WHERE campaign_id = $1`,
    [campaign.id]
  );
  console.log('4. Kanıt özeti:', summary.rows[0]);

  // Cleanup
  await pool.query(`DELETE FROM campaign_evidence WHERE id = $1`, [evidenceId]);
  console.log('✅ Tüm testler geçti');
  pool.end();
}

run().catch(e => { console.error('HATA:', e.message); pool.end(); });
