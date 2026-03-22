const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });
p.query('DELETE FROM signatures').then(() => { console.log('Cleared'); p.end(); }).catch(e => { console.error(e.message); p.end(); });
