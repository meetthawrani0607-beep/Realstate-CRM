const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.organization.findMany().then(o => console.log(o)).catch(console.error).finally(() => prisma.$disconnect());
