const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const CAMPAIGN_ID = '750f9b1a18495655bb8b5cadefaeb92f';

async function run() {
  // 1. Deadline'ı dünle set et
  await pool.query(
    "UPDATE campaigns SET response_deadline_date = NOW() - INTERVAL '1 day' WHERE id = $1",
    [CAMPAIGN_ID]
  );
  console.log('Deadline set to yesterday.');

  // 2. Servisi doğrudan çağır
  const { CampaignClosureService } = require('./dist/services/campaignClosureService');
  const svc = new CampaignClosureService();
  const result = await svc.checkResponseDeadlines();
  console.log('checkResponseDeadlines result:', result);

  // 3. Kampanyanın yeni durumunu kontrol et
  const r = await pool.query(
    'SELECT id, title, status, response_deadline_date FROM campaigns WHERE id = $1',
    [CAMPAIGN_ID]
  );
  console.log('Campaign after check:', JSON.stringify(r.rows[0], null, 2));

  // 4. Status history
  const h = await pool.query(
    'SELECT old_status, new_status, reason, created_at FROM campaign_status_history WHERE campaign_id = $1 ORDER BY created_at DESC LIMIT 3',
    [CAMPAIGN_ID]
  );
  console.log('Status history:', JSON.stringify(h.rows, null, 2));

  // 5. Timeline update
  const u = await pool.query(
    "SELECT type, title, content, created_at FROM campaign_updates WHERE campaign_id = $1 AND type = 'system_event' ORDER BY created_at DESC LIMIT 3",
    [CAMPAIGN_ID]
  );
  console.log('System events:', JSON.stringify(u.rows, null, 2));

  await pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
