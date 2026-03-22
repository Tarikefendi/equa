const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function run() {
  const user = (await pool.query(
    "SELECT id FROM users WHERE email = 'testlogin@example.com' LIMIT 1"
  )).rows[0];

  if (!user) { console.log('❌ Test kullanıcısı bulunamadı'); await pool.end(); return; }

  const id = crypto.randomBytes(16).toString('hex');

  await pool.query(`
    INSERT INTO campaigns (
      id, creator_id, title, description, target_entity, target_type, category,
      demanded_action, status, visibility, response_deadline_days,
      response_deadline_date, last_activity_at, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      'no_response', 'public', 30,
      NOW() - INTERVAL '35 days',
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '35 days'
    )
  `, [
    id, user.id,
    'Çevre Bakanlığı Fabrika Atık Denetimi Talebi',
    'Organize sanayi bölgesindeki fabrikanın nehre kimyasal atık boşalttığına dair belgeler mevcuttur. Çevre Bakanlığı\'ndan 30 gün içinde denetim yapılması ve sonucun kamuoyuyla paylaşılması talep edilmiştir.',
    'Çevre ve Şehircilik Bakanlığı',
    'government',
    'Çevre',
    'Fabrikanın derhal denetlenmesi ve denetim raporunun kamuoyuyla paylaşılması'
  ]);

  await pool.query(`
    INSERT INTO campaign_status_history (campaign_id, old_status, new_status, changed_by, reason)
    VALUES ($1, 'active', 'no_response', NULL, 'Kurum belirtilen süre içinde yanıt vermedi')
  `, [id]);

  await pool.query(`
    INSERT INTO campaign_updates (campaign_id, author_id, title, content, type)
    VALUES ($1, $2, 'Yanıt süresi doldu', 'Kurum belirtilen süre içinde yanıt vermedi.', 'system_event')
  `, [id, user.id]);

  console.log('✅ Demo kampanya oluşturuldu');
  console.log('🔗 URL: http://localhost:3000/campaigns/' + id);
  await pool.end();
}

run().catch(e => { console.error('❌', e.message); pool.end(); });
