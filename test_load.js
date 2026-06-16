const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return 'pk_' + Array.from(randomBytes).map(b => chars[b % chars.length]).join('');
}

function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function runLoadTest() {
  console.log('--- PropCRM Load & Efficiency Test ---');
  console.log('Setting up test data...');

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('No organization found to test against.');
    process.exit(1);
  }

  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);
  const apiKeyHint = `...${apiKey.slice(-4)}`;

  const portalSource = await prisma.portalSource.create({
    data: {
      name: 'Load Test Portal',
      slug: 'load-test-' + Date.now(),
      description: 'Temporary portal for load testing',
      apiKeyHash,
      apiKeyHint,
      orgId: org.id,
    }
  });

  console.log(`Created portal source: ${portalSource.name} (${portalSource.slug})`);
  console.log(`Starting load test with 50 concurrent lead import requests...`);

  const NUM_REQUESTS = 50;
  const requests = [];

  const startTime = Date.now();

  for (let i = 0; i < NUM_REQUESTS; i++) {
    // Generate some unique and some duplicate phone numbers to test dedup logic
    const phone = i % 5 === 0 ? '9999999999' : `99000${i.toString().padStart(5, '0')}`;
    const payload = {
      name: `Load Test Lead ${i}`,
      phone: phone,
      email: `test${i}@propcrm.io`,
      budget: '5000000',
      source: portalSource.slug,
      property_type: 'apartment',
      city: 'Mumbai',
      locality: 'Test Locality',
      message: 'This is a load test lead'
    };

    requests.push(
      fetch('http://localhost:3000/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      }).then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
        .catch(err => ({ status: 500, ok: false, data: { error: err.message } }))
    );
  }

  const results = await Promise.all(requests);
  const endTime = Date.now();
  
  const duration = (endTime - startTime) / 1000;
  const reqPerSec = NUM_REQUESTS / duration;

  const successes = results.filter(r => r.status === 201).length;
  const duplicates = results.filter(r => r.status === 409).length;
  const errors = results.filter(r => r.status !== 201 && r.status !== 409).length;

  console.log('\n--- Test Results ---');
  console.log(`Total Requests: ${NUM_REQUESTS}`);
  console.log(`Time Taken: ${duration.toFixed(2)} seconds`);
  console.log(`Throughput: ${reqPerSec.toFixed(2)} requests/second`);
  console.log(`Successes (New Leads): ${successes}`);
  console.log(`Duplicates Handled: ${duplicates}`);
  console.log(`Errors: ${errors}`);

  if (errors > 0) {
    console.log('\nSample Error:', results.find(r => r.status !== 201 && r.status !== 409));
  }

  console.log('\nCleaning up...');
  await prisma.portalSource.delete({ where: { id: portalSource.id } });
  
  console.log('Load Test Complete!');
  process.exit(0);
}

runLoadTest();
