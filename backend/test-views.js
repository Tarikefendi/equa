const axios = require('axios');
const BASE = 'http://localhost:5000/api/v1';
const CAMPAIGN_ID = '1de4ae1242d997bd4a050c895153e377';

async function run() {
  console.log('\n=== View Tracking Test ===\n');

  // 1. Get initial views
  const before = await axios.get(`${BASE}/campaigns/${CAMPAIGN_ID}`);
  const viewsBefore = before.data.data.views;
  console.log(`1. Views before: ${viewsBefore}`);

  // 2. First view call
  const r1 = await axios.post(`${BASE}/campaigns/${CAMPAIGN_ID}/view`);
  console.log(`2. First view: counted=${r1.data.counted}`);

  // 3. Immediate second call (should NOT count — 30min cooldown)
  const r2 = await axios.post(`${BASE}/campaigns/${CAMPAIGN_ID}/view`);
  console.log(`3. Immediate second view: counted=${r2.data.counted} (should be false)`);

  // 4. Check views after
  const after = await axios.get(`${BASE}/campaigns/${CAMPAIGN_ID}`);
  const viewsAfter = after.data.data.views;
  console.log(`4. Views after: ${viewsAfter}`);

  if (viewsAfter === viewsBefore + 1) console.log('  ✓ View count incremented by exactly 1');
  else console.log(`  ✗ Expected ${viewsBefore + 1}, got ${viewsAfter}`);

  console.log('\n=== Done ===\n');
}

run().catch(console.error);
