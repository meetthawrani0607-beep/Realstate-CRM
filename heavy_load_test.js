const http = require('http');

const NUM_CONCURRENT_WORKERS = 50; // Heavy concurrency
const REQUESTS_PER_WORKER = 200; // Total 10,000 requests
const PORT = 3003;

let successCount = 0;
let failCount = 0;
let startTime = Date.now();

// We will target the public webhook import endpoint, since it doesn't require complex session mocking, just an API key.
// Wait, we need an organization to get an API key. Let's create one first using Prisma, then run the load test.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runHeavyLoadTest() {
  console.log(`--- Heavy Load Test Started ---`);
  console.log(`Simulating ${NUM_CONCURRENT_WORKERS} concurrent agents sending ${REQUESTS_PER_WORKER} leads each... (Total: ${NUM_CONCURRENT_WORKERS * REQUESTS_PER_WORKER})`);

  // 1. Setup Dummy Org and Portal Key
  const ts = Date.now();
  const org = await prisma.organization.create({ data: { name: `LoadTest Org ${ts}`, slug: `load-test-${ts}` } });
  
  // Create a webhook source portal for the org
  const portal = await prisma.portalSource.create({
    data: {
      orgId: org.id,
      name: 'LoadTest Webhook',
      slug: 'loadtest',
      apiKeyHash: `key_${ts}`, // Fixed apiKey to apiKeyHash and added apiKeyHint
      apiKeyHint: 'test',
    }
  });
  
  await prisma.$disconnect();

  // Set up API key
  const crypto = require('crypto');
  const rawKey = `pk_key_${ts}`; // API requires 'pk_' prefix
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
  
  await prisma.portalSource.update({
    where: { id: portal.id },
    data: { apiKeyHash: hashedKey }
  });

  const apiKey = rawKey;

  // 2. Fire Requests
  const workers = [];

  for (let i = 0; i < NUM_CONCURRENT_WORKERS; i++) {
    workers.push(new Promise(async (resolve) => {
      for (let j = 0; j < REQUESTS_PER_WORKER; j++) {
        await new Promise((reqResolve) => {
          const payload = JSON.stringify({
            name: `Heavy Load Lead ${i}-${j}`,
            email: `load_${i}_${j}@example.com`,
            phone: `999${i.toString().padStart(3, '0')}${j.toString().padStart(4, '0')}`,
            source: 'loadtest',
            budget: 5000000
          });

          const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/leads/import',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
              'X-API-Key': apiKey
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode === 201 || res.statusCode === 200) {
                successCount++;
              } else {
                failCount++;
                if (failCount === 1) console.error(`First failure status: ${res.statusCode}, data: ${data}`);
              }
              reqResolve();
            });
          });

          req.on('error', (e) => {
            failCount++;
            reqResolve();
          });

          req.write(payload);
          req.end();
        });
      }
      resolve();
    }));
  }

  await Promise.all(workers);

  const durationSec = (Date.now() - startTime) / 1000;
  console.log(`\n--- Test Complete ---`);
  console.log(`Total Requests: ${NUM_CONCURRENT_WORKERS * REQUESTS_PER_WORKER}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Time taken: ${durationSec.toFixed(2)} seconds`);
  console.log(`Throughput: ${(successCount / durationSec).toFixed(2)} requests/second (RPS)`);

  // Cleanup
  const cleanupPrisma = new PrismaClient();
  await cleanupPrisma.portalLog.deleteMany({ where: { orgId: org.id } });
  await cleanupPrisma.activity.deleteMany({ where: { lead: { orgId: org.id } } });
  await cleanupPrisma.lead.deleteMany({ where: { orgId: org.id } });
  await cleanupPrisma.portalSource.deleteMany({ where: { orgId: org.id } });
  await cleanupPrisma.organization.delete({ where: { id: org.id } });
  await cleanupPrisma.$disconnect();
}

runHeavyLoadTest().catch(console.error);
