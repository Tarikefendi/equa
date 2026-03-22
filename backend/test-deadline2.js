const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const CAMPAIGN_ID = '750f9b1a18495655bb8b5cadefaeb92f';

async function run() {
  // 1. Deadline'ı dünle set et, status'u active yap (önceki test bozmuş olabilir)
  await pool.query(
    "UPDATE campaigns SET response_deadline_date = NOW() - INTERVAL '1 day', status = 'active' WHERE id = $1",
    [CAMPAIGN_ID]
  );
  console.log('Reset: status=active, deadline=yesterday');

  // 2. Servisteki SQL'i manuel çalıştır
  const eligible = await pool.query(
    `SELECT c.id, c.title, c.creator_id
     FROM campaigns c
     WHERE c.status = 'active'
       AND c.response_deadline_date IS NOT NULL
       AND c.response_deadline_date < NOW()
       AND NOT EXISTS (
         SELECT 1 FROM campaign_updates cu
         WHERE cu.campaign_id = c.id AND cu.type = 'official_response'
       )`
  );
  console.log('Eligible campaigns:', eligible.rows.map(r => r.title));

  // 3. no_response'a çek
  for (const c of eligible.rows) {
    await pool.query(
      "UPDATE campaigns SET status = 'no_response', last_activity_at = NOW() WHERE id = $1",
      [c.id]
    );
    await pool.query(
      `INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
       VALUES ($1, 'active', 'no_response', NULL, 'Kurum belirtilen süre içinde yanıt vermedi')`,
      [c.id]
    );
    await pool.query(
      `INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
       SELECT $1::text, creator_id, 'Yanıt süresi doldu', 'Kurum belirtilen süre içinde yanıt vermedi.', 'system_event'
       FROM campaigns WHERE id = $1::text`,
      [c.id]
    );
    console.log('Marked no_response:', c.title);
  }

  // 4. Sonucu kontrol et
  const r = await pool.query(
    'SELECT id, title, status FROM campaigns WHERE id = $1',
    [CAMPAIGN_ID]
  );
  console.log('\nCampaign status now:', r.rows[0].status);

  const h = await pool.query(
    'SELECT old_status, new_status, reason FROM campaign_status_history WHERE campaign_id = $1 ORDER BY created_at DESC LIMIT 2',
    [CAMPAIGN_ID]
  );
  console.log('Status history:', JSON.stringify(h.rows, null, 2));

  const u = await pool.query(
    "SELECT type, title, content FROM campaign_updates WHERE campaign_id = $1 AND type = 'system_event' ORDER BY created_at DESC LIMIT 2",
    [CAMPAIGN_ID]
  );
  console.log('System events in timeline:', JSON.stringify(u.rows, null, 2));

  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
