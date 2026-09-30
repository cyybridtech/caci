import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  console.log('Ensuring admin user (admin / admin)...');
  const hashedAdmin = await bcrypt.hash('admin', 12);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedAdmin,
      role: UserRole.ADMIN,
      mustChangePassword: false,
    },
    create: {
      username: 'admin',
      password: hashedAdmin,
      role: UserRole.ADMIN,
      mustChangePassword: false,
    },
  });
  console.log('Admin user ready! Username: admin, Password: admin, mustChangePassword: false');

  console.log('Ensuring developer user (developer / dev@caci2026)...');
  const hashedDev = await bcrypt.hash('dev@caci2026', 12);
  await prisma.user.upsert({
    where: { username: 'developer' },
    update: {
      password: hashedDev,
      role: UserRole.DEVELOPER,
      mustChangePassword: false,
    },
    create: {
      username: 'developer',
      password: hashedDev,
      role: UserRole.DEVELOPER,
      mustChangePassword: false,
    },
  });
  console.log('Developer user ready! Username: developer, Password: dev@caci2026, role: DEVELOPER');

  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error('Seed error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
