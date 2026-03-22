const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'boykot_db',
  user: 'postgres',
  password: '1627',
});

async function testCampaignImpact() {
  try {
    // Pick a campaign
    const campaignRes = await pool.query(
      'SELECT id, title, status, views FROM campaigns ORDER BY created_at DESC LIMIT 1'
    );
    if (!campaignRes.rows[0]) {
      console.log('No campaigns found.');
      return;
    }
    const campaign = campaignRes.rows[0];
    console.log(`\nTesting campaign: "${campaign.title}" (id: ${campaign.id})`);

    const [supportRes, shareRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM signatures WHERE campaign_id = $1', [campaign.id]),
      pool.query('SELECT COUNT(*) FROM campaign_shares WHERE campaign_id = $1', [campaign.id]),
    ]);

    const support_count = parseInt(supportRes.rows[0].count, 10);
    const view_count = parseInt(campaign.views, 10) || 0;
    const share_count = parseInt(shareRes.rows[0].count, 10);
    const conversion_rate = view_count > 0
      ? parseFloat(((support_count / view_count) * 100).toFixed(2))
      : 0;
    const response_received = campaign.status === 'response_received';

    const result = {
      support_count,
      view_count,
      share_count,
      conversion_rate,
      response_received,
      campaign_status: campaign.status,
    };

    console.log('\nImpact Metrics:');
    console.log(JSON.stringify(result, null, 2));

    // Verify structure
    const required = ['support_count', 'view_count', 'share_count', 'conversion_rate', 'response_received', 'campaign_status'];
    const missing = required.filter(k => !(k in result));
    if (missing.length === 0) {
      console.log('\n✅ All required fields present.');
    } else {
      console.log('\n❌ Missing fields:', missing);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

testCampaignImpact();
