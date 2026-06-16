const http = require('http');

const PORT = 3003;

async function runTests() {
  console.log('--- Advanced Security Hardening Tests ---');

  // Test 1: Check HTTP Security Headers
  console.log('\nTesting HTTP Security Headers on /login...');
  await new Promise(resolve => {
    http.get(`http://localhost:${PORT}/login`, (res) => {
      const headers = res.headers;
      console.log(`X-Frame-Options: ${headers['x-frame-options'] || 'MISSING ❌'}`);
      console.log(`Content-Security-Policy: ${headers['content-security-policy'] ? 'PRESENT ✅' : 'MISSING ❌'}`);
      console.log(`Strict-Transport-Security: ${headers['strict-transport-security'] || 'MISSING ❌'}`);
      resolve();
    });
  });

  // Test 2: Rate Limiting & Password Policy
  console.log('\nTesting Rate Limiting and Password Policy on /api/auth/register...');
  for (let i = 1; i <= 6; i++) {
    const isLast = (i === 6);
    // Use short password for the first requests to test password policy, then test rate limit
    const payload = JSON.stringify({
      userName: `Bot${i}`,
      email: `bot${i}@test.com`,
      password: i === 1 ? '123' : 'SecurePass123', // Test short pass on first try
      accountType: 'broker'
    });

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (i === 1) {
          console.log(`Attempt 1 (Short Password): Status ${res.statusCode} - ${data.includes('at least 8 characters') ? 'BLOCKED ✅' : 'FAILED ❌'}`);
        } else if (isLast) {
          console.log(`Attempt 6 (Rate Limit): Status ${res.statusCode} - ${res.statusCode === 429 ? 'RATE LIMITED ✅' : 'FAILED ❌'}`);
        }
      });
    });
    req.write(payload);
    req.end();
    
    // Wait slightly to ensure sequential processing
    await new Promise(r => setTimeout(r, 200));
  }

  // Test 3: Zip Bomb / Upload rejection
  console.log('\nTesting Zip Bomb Upload Rejection on /api/upload...');
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="bomb.zip"\r\n`;
  body += `Content-Type: application/zip\r\n\r\n`;
  body += `PK\x03\x04...fake zip data...\r\n`;
  body += `--${boundary}--\r\n`;

  const reqUpload = http.request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Zip Upload Attempt: Status ${res.statusCode} - ${res.statusCode === 415 ? 'BLOCKED (Unsupported Media Type) ✅' : 'FAILED ❌'}`);
    });
  });
  reqUpload.write(body);
  reqUpload.end();
}

runTests();
