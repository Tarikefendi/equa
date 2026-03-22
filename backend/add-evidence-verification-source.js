const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE campaign_evidence
      ADD COLUMN IF NOT EXISTS verification_source VARCHAR(50) DEFAULT 'pending_review'
    `);
    console.log('✅ verification_source kolonu eklendi');

    // Mevcut approved kayıtları için geriye dönük güncelleme
    await pool.query(`
      UPDATE campaign_evidence
      SET verification_source = 'campaign_owner'
      WHERE status = 'approved' AND verification_source = 'pending_review'
    `);
    console.log('✅ Mevcut approved kanıtlar güncellendi');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    pool.end();
  }
}

migrate();
