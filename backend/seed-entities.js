require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const entities = [
  { name: 'Türk Telekom', slug: 'turk-telekom', type: 'company', country: 'Türkiye', website: 'https://turktelekom.com.tr', description: 'Türkiye\'nin önde gelen telekomünikasyon şirketi' },
  { name: 'Çevre ve Şehircilik Bakanlığı', slug: 'cevre-sehircilik-bakanligi', type: 'government', country: 'Türkiye', website: 'https://csb.gov.tr', description: 'Türkiye Çevre ve Şehircilik Bakanlığı' },
  { name: 'Greenpeace Türkiye', slug: 'greenpeace-turkiye', type: 'organization', country: 'Türkiye', website: 'https://greenpeace.org/turkey', description: 'Çevre koruma kuruluşu' },
  { name: 'Migros', slug: 'migros', type: 'company', country: 'Türkiye', website: 'https://migros.com.tr', description: 'Türkiye\'nin büyük süpermarket zinciri' },
  { name: 'Sağlık Bakanlığı', slug: 'saglik-bakanligi', type: 'government', country: 'Türkiye', website: 'https://saglik.gov.tr', description: 'Türkiye Sağlık Bakanlığı' },
];

async function seed() {
  const client = await pool.connect();
  try {
    let inserted = 0;
    for (const e of entities) {
      const existing = await client.query('SELECT id FROM entities WHERE slug = $1', [e.slug]);
      if (existing.rows.length > 0) {
        console.log(`Zaten var: ${e.name}`);
        continue;
      }
      await client.query(
        `INSERT INTO entities (name, slug, type, description, website, country)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [e.name, e.slug, e.type, e.description, e.website, e.country]
      );
      console.log(`Eklendi: ${e.name} (${e.type})`);
      inserted++;
    }
    console.log(`\nToplam ${inserted} entity eklendi.`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
