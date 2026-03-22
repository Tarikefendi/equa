const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const entityId = 'c614766d-6a3b-477e-bd3c-4ac650bc27f9'; // Migros
  const user = await pool.query('SELECT id FROM users LIMIT 1');
  const userId = user.rows[0].id;

  const campaigns = [
    { title: 'Migros fiyat artışı şikayeti', status: 'response_received', days_ago: 5 },
    { title: 'Migros çalışan hakları', status: 'response_received', days_ago: 10 },
    { title: 'Migros ambalaj israfı', status: 'resolved', days_ago: 20 },
    { title: 'Migros gıda güvenliği', status: 'resolved', days_ago: 30 },
    { title: 'Migros müşteri hizmetleri', status: 'no_response', days_ago: 60 },
    { title: 'Migros indirim şeffaflığı', status: 'active', days_ago: 2 },
  ];

  for (const c of campaigns) {
    const createdAt = new Date(Date.now() - c.days_ago * 86400000);
    const updatedAt = new Date(createdAt.getTime() + 3 * 86400000);
    await pool.query(
      `INSERT INTO campaigns (title, description, target_entity, target_type, category, status, creator_id, entity_id, created_at, updated_at, visibility)
       VALUES ($1, 'Test kampanyası', 'Migros', 'company', 'Tüketici Hakları', $2, $3, $4, $5, $6, 'public')`,
      [c.title, c.status, userId, entityId, createdAt, updatedAt]
    );
    console.log(`  ✓ ${c.title} (${c.status})`);
  }

  console.log('\n✅ Test kampanyaları eklendi');

  // Skoru hesapla
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('http://localhost:5000/api/v1/entities/migros/transparency-score');
  const data = await res.json();
  console.log('\n📊 Migros Şeffaflık Skoru:');
  console.log(JSON.stringify(data.data, null, 2));

  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
