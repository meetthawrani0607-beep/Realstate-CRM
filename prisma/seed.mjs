import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PropCRM database...');

  // Clean
  await prisma.portalLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.message.deleteMany();
  await prisma.siteVisit.deleteMany();
  await prisma.leadProperty.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.portalSource.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  // ═══════════════════════════════════════════════════════════════
  // AGENCY ORG — "Horizon Realty"
  // ═══════════════════════════════════════════════════════════════
  const org = await prisma.organization.create({
    data: { name: 'Horizon Realty', slug: 'horizon-realty', accountType: 'agency', phone: '+91 98765 43210', email: 'info@horizonrealty.in' },
  });

  const admin = await prisma.user.create({
    data: { name: 'Arjun Mehta', email: 'admin@propcrm.io', hashedPassword: hash, role: 'admin', phone: '+91 98765 43210', orgId: org.id },
  });
  const agent = await prisma.user.create({
    data: { name: 'Priya Sharma', email: 'priya@propcrm.io', hashedPassword: hash, role: 'agent', phone: '+91 87654 32109', orgId: org.id },
  });

  // Properties
  const props = await Promise.all([
    prisma.property.create({ data: { title: 'Skyline Heights 3BHK', location: 'Bandra West', city: 'Mumbai', price: 25000000, type: 'apartment', bedrooms: 3, bathrooms: 2, area: 1450, availability: 'available', description: 'Premium sea-facing apartment with modern amenities', images: '["\\/uploads\\/apartment.png"]', orgId: org.id } }),
    prisma.property.create({ data: { title: 'Green Valley Villa', location: 'Whitefield', city: 'Bangalore', price: 45000000, type: 'villa', bedrooms: 4, bathrooms: 4, area: 3200, availability: 'available', description: 'Luxurious villa with private garden and pool', images: '["\\/uploads\\/villa.png"]', orgId: org.id } }),
    prisma.property.create({ data: { title: 'Metro Business Hub', location: 'Andheri East', city: 'Mumbai', price: 18000000, type: 'commercial', area: 2000, availability: 'available', description: 'Grade A commercial space near metro station', orgId: org.id } }),
    prisma.property.create({ data: { title: 'Sunrise Apartments 2BHK', location: 'HSR Layout', city: 'Bangalore', price: 8500000, type: 'apartment', bedrooms: 2, bathrooms: 2, area: 1100, availability: 'available', images: '["\\/uploads\\/apartment.png"]', orgId: org.id } }),
    prisma.property.create({ data: { title: 'Palm Residency Plot', location: 'Sarjapur Road', city: 'Bangalore', price: 12000000, type: 'plot', area: 2400, availability: 'available', orgId: org.id } }),
    prisma.property.create({ data: { title: 'Royal Towers Penthouse', location: 'Juhu', city: 'Mumbai', price: 85000000, type: 'apartment', bedrooms: 5, bathrooms: 5, area: 4500, availability: 'reserved', images: '["\\/uploads\\/apartment.png","\\/uploads\\/villa.png"]', orgId: org.id } }),
  ]);

  // Leads
  const leadData = [
    { name: 'Rahul Verma', phone: '9876543201', budget: 20000000, budgetMax: 30000000, propertyType: 'apartment', source: 'website', status: 'qualified', aiScore: 'hot', city: 'Mumbai', locality: 'Bandra' },
    { name: 'Sneha Patel', phone: '9876543202', budget: 40000000, budgetMax: 50000000, propertyType: 'villa', source: '99acres', status: 'visit_scheduled', aiScore: 'hot', city: 'Bangalore' },
    { name: 'Vikram Singh', phone: '9876543203', budget: 8000000, budgetMax: 12000000, propertyType: 'apartment', source: 'referral', status: 'contacted', aiScore: 'warm', city: 'Bangalore' },
    { name: 'Anjali Desai', phone: '9876543204', budget: 15000000, propertyType: 'commercial', source: 'magicbricks', status: 'negotiation', aiScore: 'hot', city: 'Mumbai' },
    { name: 'Karan Malhotra', phone: '9876543205', budget: 70000000, budgetMax: 90000000, propertyType: 'apartment', source: 'referral', status: 'new', city: 'Mumbai', locality: 'Juhu' },
    { name: 'Meera Joshi', phone: '9876543206', budget: 10000000, propertyType: 'plot', source: 'website', status: 'contacted', aiScore: 'warm', city: 'Bangalore' },
    { name: 'Amit Khanna', phone: '9876543207', budget: 5000000, budgetMax: 9000000, propertyType: 'apartment', source: 'walkin', status: 'new', aiScore: 'cold' },
    { name: 'Divya Reddy', phone: '9876543208', budget: 25000000, propertyType: 'villa', source: 'whatsapp', status: 'qualified', aiScore: 'warm', city: 'Bangalore' },
    { name: 'Rohan Gupta', phone: '9876543209', budget: 12000000, propertyType: 'apartment', source: '99acres', status: 'new', city: 'Mumbai' },
    { name: 'Nisha Agarwal', phone: '9876543210', budget: 35000000, budgetMax: 45000000, propertyType: 'villa', source: 'referral', status: 'closed_won', aiScore: 'hot', city: 'Bangalore' },
    { name: 'Suresh Kumar', phone: '9876543211', budget: 6000000, propertyType: 'apartment', source: 'website', status: 'contacted', aiScore: 'cold' },
    { name: 'Pooja Nair', phone: '9876543212', budget: 18000000, propertyType: 'commercial', source: 'magicbricks', status: 'qualified', aiScore: 'warm', city: 'Mumbai' },
  ];

  const leads = [];
  for (const ld of leadData) {
    const lead = await prisma.lead.create({
      data: { ...ld, orgId: org.id, assignedToId: Math.random() > 0.5 ? admin.id : agent.id },
    });
    leads.push(lead);
  }

  // Activities
  const actTypes = ['call', 'note', 'whatsapp', 'system'];
  const actTitles = { call: 'Phone call', note: 'Note added', whatsapp: 'WhatsApp message', system: 'Status updated' };
  const actContents = [
    'Discussed budget and property requirements',
    'Client interested in Bandra area properties',
    'Sent property brochure via WhatsApp',
    'Follow-up call scheduled for next week',
    'Client wants to visit this weekend',
    'Negotiating price — client counter-offered',
    'Sent 3 property options matching criteria',
    'Client referred by existing customer',
  ];

  for (const lead of leads) {
    const count = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const type = actTypes[Math.floor(Math.random() * actTypes.length)];
      await prisma.activity.create({
        data: {
          type, title: actTitles[type],
          content: actContents[Math.floor(Math.random() * actContents.length)],
          leadId: lead.id, userId: admin.id,
          createdAt: new Date(Date.now() - Math.random() * 7 * 86400000),
        },
      });
    }
  }

  // Sample messages
  for (const lead of leads.slice(0, 5)) {
    await prisma.message.create({
      data: { direction: 'outbound', content: `Hi ${lead.name}, thank you for your interest in our properties!`, leadId: lead.id, userId: admin.id },
    });
    await prisma.message.create({
      data: { direction: 'inbound', content: 'Thanks! Can you share more details about 2-3 BHK options?', leadId: lead.id },
    });
  }

  // Site visits
  const tomorrow = new Date(Date.now() + 86400000);
  const dayAfter = new Date(Date.now() + 2 * 86400000);
  await prisma.siteVisit.create({ data: { date: tomorrow, time: '10:00', status: 'scheduled', leadId: leads[1].id, propertyId: props[1].id, agentId: admin.id, orgId: org.id } });
  await prisma.siteVisit.create({ data: { date: tomorrow, time: '14:00', status: 'confirmed', leadId: leads[0].id, propertyId: props[0].id, agentId: admin.id, orgId: org.id } });
  await prisma.siteVisit.create({ data: { date: dayAfter, time: '11:00', status: 'scheduled', leadId: leads[3].id, propertyId: props[2].id, agentId: agent.id, orgId: org.id } });

  // ═══════════════════════════════════════════════════════════════
  // BROKER ORG — Solo broker "Rajesh Kapoor"
  // ═══════════════════════════════════════════════════════════════
  const brokerOrg = await prisma.organization.create({
    data: { name: "Rajesh Kapoor's Workspace", slug: 'rajesh-kapoor', accountType: 'broker' },
  });

  const broker = await prisma.user.create({
    data: { name: 'Rajesh Kapoor', email: 'broker@propcrm.io', hashedPassword: hash, role: 'broker_owner', phone: '+91 99887 76655', orgId: brokerOrg.id },
  });

  // Broker properties
  await Promise.all([
    prisma.property.create({ data: { title: 'Lake View 2BHK', location: 'Powai', city: 'Mumbai', price: 15000000, type: 'apartment', bedrooms: 2, bathrooms: 2, area: 980, availability: 'available', orgId: brokerOrg.id } }),
    prisma.property.create({ data: { title: 'Garden Homes Villa', location: 'Koramangala', city: 'Bangalore', price: 32000000, type: 'villa', bedrooms: 3, bathrooms: 3, area: 2200, availability: 'available', orgId: brokerOrg.id } }),
  ]);

  // Broker leads
  const brokerLeadData = [
    { name: 'Sanjay Mehta', phone: '9988776601', budget: 14000000, propertyType: 'apartment', source: 'referral', status: 'qualified', aiScore: 'hot', city: 'Mumbai' },
    { name: 'Rekha Sharma', phone: '9988776602', budget: 30000000, propertyType: 'villa', source: 'website', status: 'contacted', aiScore: 'warm', city: 'Bangalore' },
    { name: 'Deepak Jain', phone: '9988776603', budget: 10000000, propertyType: 'apartment', source: 'walkin', status: 'new', aiScore: 'cold' },
    { name: 'Kavitha Rao', phone: '9988776604', budget: 22000000, propertyType: 'villa', source: '99acres', status: 'negotiation', aiScore: 'hot', city: 'Bangalore' },
  ];

  for (const ld of brokerLeadData) {
    const lead = await prisma.lead.create({
      data: { ...ld, orgId: brokerOrg.id, assignedToId: broker.id },
    });
    await prisma.activity.create({
      data: {
        type: 'call', title: 'Phone call',
        content: 'Initial conversation about property requirements',
        leadId: lead.id, userId: broker.id,
        createdAt: new Date(Date.now() - Math.random() * 5 * 86400000),
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('   🏢 Agency Account:');
  console.log(`      Org: ${org.name}`);
  console.log(`      Login: admin@propcrm.io / password123`);
  console.log(`      Agent: priya@propcrm.io / password123`);
  console.log(`      Leads: ${leads.length} | Properties: ${props.length}`);
  console.log('');
  console.log('   🧑‍💼 Broker Account:');
  console.log(`      Org: ${brokerOrg.name}`);
  console.log(`      Login: broker@propcrm.io / password123`);
  console.log(`      Leads: ${brokerLeadData.length} | Properties: 2`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
