const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'boykot_db',
  user: 'postgres',
  password: '1627',
});

async function run() {
  const client = await pool.connect();
  try {
    // Ensure columns exist
    await client.query(`
      ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS response_deadline_days INTEGER DEFAULT 30,
        ADD COLUMN IF NOT EXISTS response_deadline_date TIMESTAMP;
    `);

    // Set default 30 days for campaigns that have no deadline set
    const result = await client.query(`
      UPDATE campaigns
      SET
        response_deadline_days = 30,
        response_deadline_date = created_at + INTERVAL '30 days'
      WHERE response_deadline_days IS NULL
        AND status IN ('active', 'response_received')
    `);
    console.log(`Updated ${result.rowCount} campaigns with default 30-day deadline.`);

    // For campaigns that have deadline_days but no deadline_date, compute it
    const result2 = await client.query(`
      UPDATE campaigns
      SET response_deadline_date = created_at + (response_deadline_days || ' days')::interval
      WHERE response_deadline_days IS NOT NULL
        AND response_deadline_date IS NULL
        AND status IN ('active', 'response_received')
    `);
    console.log(`Computed deadline_date for ${result2.rowCount} campaigns.`);

    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
