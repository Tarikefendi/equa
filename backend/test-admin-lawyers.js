const http = require('http');

// Önce login ol
const loginData = JSON.stringify({ email: 'testlogin@example.com', password: '12345678' });

const loginReq = http.request({
  hostname: 'localhost', port: 5000,
  path: '/api/v1/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const body = JSON.parse(d);
    const token = body.data?.token || body.token;
    console.log('Token alındı:', token ? 'OK' : 'HATA', body.message || '');
    if (!token) return;

    // Pending lawyers endpoint'ini çağır
    http.get({
      hostname: 'localhost', port: 5000,
      path: '/api/v1/admin/lawyers/pending',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res2) => {
      let d2 = '';
      res2.on('data', c => d2 += c);
      res2.on('end', () => console.log('Pending lawyers response:', res2.statusCode, d2));
    }).on('error', e => console.error(e.message));
  });
});
loginReq.write(loginData);
loginReq.end();
