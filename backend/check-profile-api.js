require('dotenv').config();
const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 5000,
      path: `/api/v1${path}`, method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, data }); } });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  const loginRes = await request('POST', '/auth/login', { email: 'testlogin@example.com', password: '12345678' });
  const token = loginRes.data.data.token;
  const profileRes = await request('GET', '/auth/profile', null, token);
  console.log('Profile data:', JSON.stringify(profileRes.data.data, null, 2));
}
run().catch(console.error);
