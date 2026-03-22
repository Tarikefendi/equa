const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NSHFlKGPWDinJSTbhVaPzVfTSUsVKlAj@caboose.proxy.rlwy.net:28741/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS campaign_case_seq START 1`);
    console.log('✅ campaign_case_seq sequence oluşturuldu');

    // Mevcut kampanyalara case_number ata (boş olanlar)
    const campaigns = await pool.query(
      `SELECT id, created_at FROM campaigns WHERE case_number IS NULL ORDER BY created_at ASC`
    );
    for (const row of campaigns.rows) {
      const year = new Date(row.created_at).getFullYear();
      const seq = await pool.query(`SELECT nextval('campaign_case_seq') as n`);
      const num = String(seq.rows[0].n).padStart(6, '0');
      const caseNumber = `EQUA-${year}-${num}`;
      await pool.query(`UPDATE campaigns SET case_number = $1 WHERE id = $2`, [caseNumber, row.id]);
      console.log(`  → ${caseNumber}`);
    }
    console.log('✅ Tamamlandı');
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await pool.end();
  }
}

run();
