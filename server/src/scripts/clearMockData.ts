import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  console.log('=============================================');
  console.log('  CACI Church - Clearing Mock/Demo Data      ');
  console.log('=============================================');

  try {
    // 1. Delete dependent child records
    console.log('--> Deleting celebration logs...');
    await prisma.celebrationLog.deleteMany();

    console.log('--> Deleting pledge payments & pledges...');
    await prisma.pledgePayment.deleteMany();
    await prisma.memberPledge.deleteMany();
    await prisma.pledgeCampaign.deleteMany();

    console.log('--> Deleting financial contributions & message logs...');
    await prisma.financialContribution.deleteMany();
    await prisma.messageLog.deleteMany();

    console.log('--> Deleting attendance records...');
    await prisma.attendanceRecord.deleteMany();

    console.log('--> Deleting member department relations...');
    await prisma.memberDepartment.deleteMany();

    console.log('--> Deleting all mock members...');
    await prisma.member.deleteMany();

    console.log('--> Deleting service sessions...');
    await prisma.serviceSession.deleteMany();

    // 2. Ensure standard clean CACI church auxiliary departments exist
    console.log('--> Ensuring standard clean CACI auxiliary departments are configured...');
    const standardDepartments = [
      { name: 'Choir & Music Ministry', description: 'Leads congregational praise and worship' },
      { name: 'Ushers & Protocol', description: 'Welcoming congregants, door coordination and seating' },
      { name: 'Media & Technical Desk', description: 'Audio, projection, live stream and digital check-in' },
      { name: "Men's Fellowship (PEMEM)", description: 'Empowering men in the church and community' },
      { name: "Women's Fellowship", description: 'Ministry for women spiritual growth and welfare' },
      { name: 'Youth Ministry', description: 'Dynamic youth fellowship and leadership' },
      { name: "Children's Ministry", description: 'Sunday School and moral training for children' },
      { name: 'Evangelism & Follow-up', description: 'Soul winning and visitor assimilation' },
      { name: 'Prayer Warriors', description: 'Intercessory prayers and fasting ministry' }
    ];

    for (const dept of standardDepartments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: {},
        create: {
          name: dept.name,
          description: dept.description
        }
      });
    }

    // 3. Create initial clean service session for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const initialSession = await prisma.serviceSession.create({
      data: {
        serviceDate: today,
        serviceType: 'Sunday Divine Worship Service',
        theme: 'New Season of Grace',
        notes: 'Initial clean service session'
      }
    });

    console.log(`--> Created today's initial active service session: ${initialSession.serviceType}`);
    console.log('=============================================');
    console.log('  SUCCESS! All mock members & data cleared.  ');
    console.log('  CACI Church Database is ready for real data.');
    console.log('=============================================');
  } catch (error) {
    console.error('Error clearing database data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
