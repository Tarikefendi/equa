const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627',
});

async function test() {
  try {
    // 1) Fetch categories
    const cats = await pool.query('SELECT * FROM standard_categories ORDER BY name');
    console.log(`\n✅ Categories (${cats.rows.length}):`);
    cats.rows.forEach(c => console.log(`  - [${c.id}] ${c.name}`));

    // 2) Fetch standards
    const stds = await pool.query(`
      SELECT s.id, s.title, sc.name AS category FROM standards s
      LEFT JOIN standard_categories sc ON sc.id = s.category_id ORDER BY s.title
    `);
    console.log(`\n✅ Standards (${stds.rows.length}):`);
    stds.rows.forEach(s => console.log(`  - [${s.id}] ${s.title} (${s.category})`));

    // 3) Create suggestion
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRes.rows[0]?.id;
    if (!userId) { console.log('\n⚠️  No users found, skipping suggestion test'); return; }

    const sug = await pool.query(
      `INSERT INTO standard_suggestions (title, description, category_id, source_url, suggested_by, ai_confidence, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      ['Test Standart Önerisi', 'Test açıklaması', cats.rows[0]?.id || null, 'https://example.com', userId, 0.75]
    );
    console.log(`\n✅ Suggestion created: [${sug.rows[0].id}] "${sug.rows[0].title}" (ai_confidence: ${sug.rows[0].ai_confidence})`);

    // 4) Simulate admin approval
    const sugId = sug.rows[0].id;
    const newStd = await pool.query(
      `INSERT INTO standards (title, description, category_id, source_url)
       SELECT title, description, category_id, source_url FROM standard_suggestions WHERE id = $1
       RETURNING *`,
      [sugId]
    );
    await pool.query(`UPDATE standard_suggestions SET status = 'approved' WHERE id = $1`, [sugId]);
    console.log(`\n✅ Approved → Standard created: [${newStd.rows[0].id}] "${newStd.rows[0].title}"`);

    // 5) Verify structure
    const check = await pool.query('SELECT * FROM standard_suggestions WHERE id = $1', [sugId]);
    console.log(`\n✅ Suggestion status: ${check.rows[0].status}`);
    console.log('\n✅ All tests passed.');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    await pool.end();
  }
}

test();
