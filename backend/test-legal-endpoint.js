const fetch = require('node-fetch');

const CAMPAIGN_ID = '750f9b1a18495655bb8b5cadefaeb92f';

async function run() {
  const res = await fetch(`http://localhost:5000/api/v1/campaigns/${CAMPAIGN_ID}/legal-status`);
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

run().catch(e => console.error('Backend not running?', e.message));
