const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'boykot_db',
  user: 'postgres',
  password: '1627',
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS standard_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS standards (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES standard_categories(id),
        source_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS standard_suggestions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES standard_categories(id),
        source_url TEXT,
        suggested_by TEXT REFERENCES users(id),
        ai_confidence FLOAT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS standard_id INTEGER REFERENCES standards(id)
    `);

    // Seed default categories
    const cats = [
      ['Tüketici Koruma', 'Tüketici hakları ve koruma standartları'],
      ['Çalışma Standartları', 'İşçi hakları ve çalışma koşulları'],
      ['Çevre Standartları', 'Çevresel sürdürülebilirlik ve koruma'],
      ['Veri Gizliliği', 'Kişisel veri koruma ve gizlilik'],
      ['Kurumsal Şeffaflık', 'Kurumsal hesap verebilirlik ve şeffaflık'],
      ['İnsan Hakları', 'Temel insan hakları standartları'],
    ];

    for (const [name, description] of cats) {
      await client.query(
        `INSERT INTO standard_categories (name, description)
         SELECT $1::VARCHAR, $2::TEXT WHERE NOT EXISTS (SELECT 1 FROM standard_categories WHERE name = $1::VARCHAR)`,
        [name, description]
      );
    }

    // Seed sample standards
    const catRes = await client.query('SELECT id, name FROM standard_categories');
    const catMap = Object.fromEntries(catRes.rows.map(r => [r.name, r.id]));

    const standards = [
      ['AB Tüketici Hakları Direktifi', 'Tüketicilerin iade, bilgi ve sözleşme haklarını düzenler.', catMap['Tüketici Koruma'], 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32011L0083'],
      ['ILO Temel Çalışma Standartları', 'Zorla çalıştırma, çocuk işçiliği ve ayrımcılık yasağı.', catMap['Çalışma Standartları'], 'https://www.ilo.org/global/standards/lang--en/index.htm'],
      ['Paris Anlaşması İklim Taahhütleri', 'Küresel ısınmayı 1.5°C ile sınırlandırma hedefleri.', catMap['Çevre Standartları'], 'https://unfccc.int/process-and-meetings/the-paris-agreement'],
      ['GDPR — Genel Veri Koruma Tüzüğü', 'AB vatandaşlarının kişisel verilerinin korunması.', catMap['Veri Gizliliği'], 'https://gdpr.eu/'],
      ['KVKK — Kişisel Verilerin Korunması Kanunu', 'Türkiye kişisel veri koruma mevzuatı.', catMap['Veri Gizliliği'], 'https://www.kvkk.gov.tr/'],
      ['BM İş Dünyası ve İnsan Hakları Rehber İlkeleri', 'Şirketlerin insan hakları sorumluluklarını tanımlar.', catMap['İnsan Hakları'], 'https://www.ohchr.org/documents/publications/guidingprinciplesbusinesshr_en.pdf'],
      ['İnsan Hakları Evrensel Beyannamesi', 'Temel insan haklarını tanımlayan BM belgesi.', catMap['İnsan Hakları'], 'https://www.un.org/en/about-us/universal-declaration-of-human-rights'],
    ];

    for (const [title, description, category_id, source_url] of standards) {
      if (!category_id) continue;
      await client.query(
        `INSERT INTO standards (title, description, category_id, source_url)
         SELECT $1::VARCHAR, $2::TEXT, $3::INTEGER, $4::TEXT WHERE NOT EXISTS (SELECT 1 FROM standards WHERE title = $1::VARCHAR)`,
        [title, description, category_id, source_url]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Standards library migration completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
