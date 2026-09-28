import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function migrate() {
  console.log('Migrating existing groups (GROUP_1 -> JOY, GROUP_2 -> FAITH)...');
  try {
    // If the table currently has string or enum values, update them
    await prisma.$executeRawUnsafe(`UPDATE members SET churchGroup = 'JOY' WHERE churchGroup = 'GROUP_1' OR churchGroup = 'JOY'`);
    await prisma.$executeRawUnsafe(`UPDATE members SET churchGroup = 'FAITH' WHERE churchGroup = 'GROUP_2'`);
    console.log('Group migration successfully executed.');
  } catch (err: any) {
    console.warn('Note on raw migration (schema push might handle or table was empty):', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
