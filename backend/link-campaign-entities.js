const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT||'5432'), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });

async function run() {
  // Migros entity'sini bul
  const migros = await pool.query("SELECT id FROM entities WHERE slug = 'migros'");
  if (!migros.rows.length) { console.log('Migros entity bulunamadı'); return; }
  const migrosId = migros.rows[0].id;

  // Migros kampanyasını bağla
  const r = await pool.query(
    "UPDATE campaigns SET entity_id = $1 WHERE id = '1b8218846714c31e1dd306f6a060100a' RETURNING title",
    [migrosId]
  );
  console.log('Bağlandı:', r.rows[0]?.title);
  await pool.end();
}
run().catch(console.error);
