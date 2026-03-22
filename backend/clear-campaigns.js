const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

const tables = [
  'lawyer_applications',
  'legal_requests',
  'campaign_shares',
  'campaign_views',
  'campaign_followers',
  'campaign_reports',
  'campaign_status_history',
  'campaign_updates',
  'evidence_flags',
  'evidence',
  'signatures',
  'campaigns',
];

async function run() {
  for (const t of tables) {
    try {
      await pool.query('DELETE FROM ' + t);
      console.log('Silindi:', t);
    } catch (e) {
      console.log('Atlandı:', t, '-', e.message);
    }
  }
  try {
    await pool.query("DELETE FROM notifications WHERE entity_type = 'campaign'");
    console.log('Silindi: notifications (campaign)');
  } catch (e) {
    console.log('Atlandı: notifications -', e.message);
  }
  const r = await pool.query('SELECT COUNT(*) FROM campaigns');
  console.log('Kalan kampanya:', r.rows[0].count);
  pool.end();
}

run();
