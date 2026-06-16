const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetPasswords() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    where: { email: 'meetthawrani0607@gmail.com' },
    data: { hashedPassword: hash }
  });
  console.log('Password reset successfully for meetthawrani0607@gmail.com to password123');
}

resetPasswords().catch(console.error).finally(() => prisma.$disconnect());
