import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  console.log('Ensuring admin user (admin / admin)...');
  const hashed = await bcrypt.hash('admin', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashed,
      role: UserRole.ADMIN,
      mustChangePassword: false,
    },
    create: {
      username: 'admin',
      password: hashed,
      role: UserRole.ADMIN,
      mustChangePassword: false,
    },
  });
  console.log('Admin user ready! Username: admin, Password: admin, mustChangePassword: false');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error('Seed error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
