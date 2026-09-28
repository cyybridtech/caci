import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  console.log('Checking for admin user...');
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (existing) {
    console.log('Admin user already exists:', existing.username);
    await prisma.$disconnect();
    return;
  }
  const hashed = await bcrypt.hash('admin', 12);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashed,
      role: UserRole.ADMIN,
      mustChangePassword: true,
    },
  });
  console.log('Admin user created successfully! Username: admin, Password: admin (must change on first login)');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error('Seed error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
