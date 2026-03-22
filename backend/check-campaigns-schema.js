const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

pool.query(
  "SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'campaigns' ORDER BY ordinal_position"
).then(r => {
  r.rows.forEach(c => console.log(c.column_name.padEnd(30), c.is_nullable, c.data_type));
  pool.end();
});
