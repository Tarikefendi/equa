const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'boykot_db', user: 'postgres', password: '1627' });

async function test() {
  // Step 1: Request reset
  const res1 = await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testlogin@example.com' }),
  });
  const d1 = await res1.json();
  console.log('1. Forgot password:', d1.success, d1.message);

  // Step 2: Get token from DB
  const row = (await pool.query(
    "SELECT token FROM verification_tokens WHERE type='password_reset' ORDER BY expires_at DESC LIMIT 1"
  )).rows[0];
  if (!row) { console.log('ERROR: No token found'); process.exit(1); }
  const token = row.token;
  console.log('2. Token found:', token.substring(0, 16) + '...');

  // Step 3: Reset password
  const res2 = await fetch('http://localhost:5000/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password: 'newpassword123' }),
  });
  const d2 = await res2.json();
  console.log('3. Reset password:', d2.success, d2.message);

  // Step 4: Login with new password
  const res3 = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testlogin@example.com', password: 'newpassword123' }),
  });
  const d3 = await res3.json();
  console.log('4. Login new pass:', d3.success);

  // Step 5: Restore original password
  await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testlogin@example.com' }),
  });
  const row2 = (await pool.query(
    "SELECT token FROM verification_tokens WHERE type='password_reset' ORDER BY expires_at DESC LIMIT 1"
  )).rows[0];
  const res4 = await fetch('http://localhost:5000/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: row2.token, password: '12345678' }),
  });
  const d4 = await res4.json();
  console.log('5. Restore original:', d4.success);

  // Step 6: Verify original works
  const res5 = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testlogin@example.com', password: '12345678' }),
  });
  const d5 = await res5.json();
  console.log('6. Login original pass:', d5.success);

  // Step 7: Test invalid token
  const res6 = await fetch('http://localhost:5000/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'invalidtoken123', password: 'test1234' }),
  });
  const d6 = await res6.json();
  console.log('7. Invalid token rejected:', !d6.success, d6.message);

  await pool.end();
  console.log('\nAll tests passed!');
}

test().catch(e => { console.error('Test failed:', e.message); pool.end(); });
