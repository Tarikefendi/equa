const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'equa_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function run() {
  const client = await pool.connect();
  try {
    // 1. Sütunu ekle
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE
    `);
    console.log('✅ case_number sütunu eklendi');

    // 2. Sequence oluştur (yıl bazlı değil, global — yıl prefix'e ekleniyor)
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS campaign_case_seq START 1
    `);
    console.log('✅ campaign_case_seq sequence oluşturuldu');

    // 3. Mevcut kampanyalara geriye dönük case_number ata
    const campaigns = await client.query(
      `SELECT id, created_at FROM campaigns WHERE case_number IS NULL ORDER BY created_at ASC`
    );
    for (const row of campaigns.rows) {
      const year = new Date(row.created_at).getFullYear();
      const seq = await client.query(`SELECT nextval('campaign_case_seq') as n`);
      const num = String(seq.rows[0].n).padStart(6, '0');
      const caseNumber = `EQUA-${year}-${num}`;
      await client.query(`UPDATE campaigns SET case_number = $1 WHERE id = $2`, [caseNumber, row.id]);
      console.log(`  → ${row.id}: ${caseNumber}`);
    }

    console.log('✅ Tüm mevcut kampanyalara case_number atandı');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
