const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runBenchmark() {
  console.log('--- Database Load Benchmark (High Volume Data) ---');
  
  let org = await prisma.organization.findFirst();
  if (!org) org = await prisma.organization.create({ data: { name: 'Test Org' } });
  const orgId = org.id;
  
  const leadCount = await prisma.lead.count({ where: { orgId } });
  if (leadCount < 1000) {
    console.log('Inserting 2,000 dummy leads for realistic load testing...');
    const dummyLeads = Array(2000).fill(0).map((_, i) => ({
      orgId,
      name: `Lead ${i}`,
      phone: `999000${i.toString().padStart(4, '0')}`,
      status: ['new', 'contacted', 'qualified', 'visit_scheduled', 'closed_won', 'closed_lost'][i % 6],
      source: ['Website', 'Referral', 'Walkin', '99acres', 'Magicbricks'][i % 5]
    }));
    await prisma.lead.createMany({ data: dummyLeads });
    console.log('Inserted.');
  } else {
    console.log(`Using existing ${leadCount} leads for testing.`);
  }

  console.log('\nTesting Unoptimized JS Processing (Old Method)...');
  const startOld = Date.now();
  for (let i = 0; i < 20; i++) {
    // Old method: fetch all leads to memory to count sources
    const allLeads = await prisma.lead.findMany({ where: { orgId }, select: { source: true } });
    const map = {};
    allLeads.forEach(l => { map[l.source] = (map[l.source] || 0) + 1; });
  }
  const timeOld = Date.now() - startOld;
  console.log(`Old Method Time for 20 requests: ${timeOld}ms`);

  console.log('\nTesting Optimized GroupBy (New Method)...');
  const startNew = Date.now();
  for (let i = 0; i < 20; i++) {
    // New method: let DB count sources
    await prisma.lead.groupBy({ by: ['source'], _count: { source: true }, where: { orgId } });
  }
  const timeNew = Date.now() - startNew;
  console.log(`New Method Time for 20 requests: ${timeNew}ms`);
  
  console.log(`\nPerformance Improvement: ${((timeOld - timeNew) / timeOld * 100).toFixed(2)}% faster memory & CPU execution.`);
  
  await prisma.$disconnect();
}

runBenchmark();
