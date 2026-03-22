const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Bir kampanya bul
  const camp = (await pool.query(`SELECT id, title, creator_id, investigation_mode FROM campaigns WHERE status = 'active' LIMIT 1`)).rows[0];
  if (!camp) { console.log('Aktif kampanya bulunamadı'); pool.end(); return; }
  console.log('Test kampanyası:', camp.title, '| investigation_mode:', camp.investigation_mode);

  // Toggle ON
  await pool.query('UPDATE campaigns SET investigation_mode = true WHERE id = $1', [camp.id]);
  const on = (await pool.query('SELECT investigation_mode FROM campaigns WHERE id = $1', [camp.id])).rows[0];
  console.log('✅ Toggle ON:', on.investigation_mode);

  // Investigation summary
  const summary = (await pool.query(`
    SELECT
      COUNT(*) AS evidence_submitted,
      COUNT(*) FILTER (WHERE status = 'approved') AS evidence_verified,
      COUNT(*) FILTER (WHERE status = 'pending')  AS evidence_pending,
      COUNT(*) FILTER (WHERE status = 'flagged')  AS evidence_flagged
    FROM campaign_evidence WHERE campaign_id = $1
  `, [camp.id])).rows[0];
  console.log('✅ Investigation summary:', summary);

  // Toggle OFF
  await pool.query('UPDATE campaigns SET investigation_mode = false WHERE id = $1', [camp.id]);
  const off = (await pool.query('SELECT investigation_mode FROM campaigns WHERE id = $1', [camp.id])).rows[0];
  console.log('✅ Toggle OFF:', off.investigation_mode);

  console.log('\n✅ Tüm testler geçti');
  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
