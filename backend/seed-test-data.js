const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'boykot_db',
  user: 'postgres',
  password: '1627',
});

async function seed() {
  try {
    console.log('Connecting to PostgreSQL...');
    await pool.query('SELECT 1');
    console.log('Connected!');

    // Check/create test user
    let user = (await pool.query("SELECT id FROM users WHERE email = 'testlogin@example.com'")).rows[0];
    if (!user) {
      const userId = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash('12345678', 12);
      await pool.query(
        `INSERT INTO users (id, email, username, password_hash, is_verified, role, reputation_score)
         VALUES ($1, $2, $3, $4, 1, 'admin', 500)`,
        [userId, 'testlogin@example.com', 'testuser', hash]
      );
      user = { id: userId };
      console.log('Test user created:', userId);
    } else {
      console.log('Test user exists:', user.id);
    }

    // Create test campaigns
    const campaigns = [
      {
        title: 'Çevre Kirliliği Şikayeti - Fabrika Atıkları',
        description: 'XYZ Fabrikası çevreye zarar veren atıkları yasadışı biçimde nehre dökmektedir. Bu durum hem insan sağlığını hem de ekosistemi tehdit etmektedir.',
        target_entity: 'XYZ Sanayi A.Ş.',
        target_type: 'company',
        category: 'Çevre',
        standard_reference: 'Çevre Kanunu Madde 8',
        demanded_action: 'Atık arıtma tesisi kurulması ve mevcut kirliliğin temizlenmesi',
        response_deadline_days: 30,
        status: 'active',
      },
      {
        title: 'İşçi Hakları İhlali - Fazla Mesai Ödemeleri',
        description: 'ABC Şirketi çalışanlarına yasal fazla mesai ücretlerini ödememektedir. Yüzlerce işçi mağdur durumdadır.',
        target_entity: 'ABC Tekstil Ltd.',
        target_type: 'company',
        category: 'İşçi Hakları',
        standard_reference: 'İş Kanunu Madde 41',
        demanded_action: 'Tüm birikmiş fazla mesai ücretlerinin 30 gün içinde ödenmesi',
        response_deadline_days: 30,
        status: 'active',
      },
      {
        title: 'Tüketici Hakkı İhlali - Yanıltıcı Reklam',
        description: 'DEF Gıda şirketi ürünlerinde yanıltıcı etiketleme yaparak tüketicileri aldatmaktadır.',
        target_entity: 'DEF Gıda A.Ş.',
        target_type: 'brand',
        category: 'Tüketici Hakları',
        standard_reference: 'Tüketicinin Korunması Hakkında Kanun Madde 61',
        demanded_action: 'Yanıltıcı etiketlerin kaldırılması ve tüketicilere tazminat ödenmesi',
        response_deadline_days: 15,
        status: 'active',
      },
    ];

    for (const c of campaigns) {
      const id = crypto.randomBytes(16).toString('hex');
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + c.response_deadline_days);

      await pool.query(
        `INSERT INTO campaigns (id, creator_id, title, description, target_entity, target_type, category,
          standard_reference, demanded_action, response_deadline_days, response_deadline_date,
          status, goals, evidence)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'{}','{}')
         ON CONFLICT DO NOTHING`,
        [id, user.id, c.title, c.description, c.target_entity, c.target_type, c.category,
         c.standard_reference, c.demanded_action, c.response_deadline_days, deadlineDate.toISOString(),
         c.status]
      );
      console.log('Campaign created:', c.title);
    }

    console.log('\nDone! Test data seeded successfully.');
    console.log('Login: testlogin@example.com / 12345678');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
