const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function autoArchiveInactive() {
  const result = await pool.query(
    `SELECT id, title, status, last_activity_at FROM campaigns
     WHERE status IN ('active', 'response_received')
       AND last_activity_at < NOW() - INTERVAL '180 days'`
  );

  const campaigns = result.rows;
  console.log(`\n📋 Arşivlenecek kampanya sayısı: ${campaigns.length}`);

  for (const campaign of campaigns) {
    console.log(`  → ${campaign.id} | "${campaign.title}" | ${campaign.status} | last_activity: ${campaign.last_activity_at}`);

    await pool.query(
      `UPDATE campaigns SET status = 'archived', archived_at = NOW(), last_activity_at = NOW() WHERE id = $1`,
      [campaign.id]
    );

    await pool.query(
      `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
       VALUES ($1, $2, 'archived', NULL, 'Hareketsizlik nedeniyle otomatik arşivlendi')`,
      [campaign.id, campaign.status]
    );

    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
       SELECT $1::text, creator_id, 'Kampanya otomatik arşivlendi', '180 gün hareketsizlik nedeniyle otomatik olarak arşivlendi.', 'system_event'
       FROM campaigns WHERE id = $1::text`,
      [campaign.id]
    );

    console.log(`  ✅ Arşivlendi: ${campaign.id}`);
  }

  // Verify
  const check = await pool.query(
    `SELECT id, title, status, archived_at FROM campaigns WHERE id = 'd9047cc1baccac06aebe9899873a4363'`
  );
  console.log(`\n🔍 Doğrulama: ${check.rows[0]?.title} → status: ${check.rows[0]?.status}, archived_at: ${check.rows[0]?.archived_at}`);

  await pool.end();
}

console.log('=== Auto-Archive Job Test ===');
autoArchiveInactive().catch(console.error);
