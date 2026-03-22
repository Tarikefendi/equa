const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  // Direkt DB'den bekleyen avukatları çek
  const res = await pool.query(`
    SELECT l.*, u.username, u.email 
    FROM lawyers l 
    JOIN users u ON l.user_id = u.id 
    WHERE l.is_verified = 0
  `);
  console.log('Bekleyen avukatlar:', res.rows);

  // LawyerService'in getPendingLawyers sorgusunu kontrol et
  const res2 = await pool.query(`SELECT * FROM lawyers WHERE is_verified = 0`);
  console.log('is_verified=0 olanlar:', res2.rows);
  
  pool.end();
}
run().catch(e => { console.error(e); pool.end(); });
