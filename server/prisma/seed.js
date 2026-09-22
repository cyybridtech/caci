"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding CACI Church Database with Senior Developer Crafted Data...');
    // 1. Clean existing records
    await prisma.messageLog.deleteMany();
    await prisma.financialContribution.deleteMany();
    await prisma.attendanceRecord.deleteMany();
    await prisma.memberDepartment.deleteMany();
    await prisma.department.deleteMany();
    await prisma.serviceSession.deleteMany();
    await prisma.member.deleteMany();
    // 2. Seed Departments
    const departmentsData = [
        { name: 'Choir & Music Ministry', description: 'Leads congregational praise and worship', leaderName: 'Brother Emmanuel Osei' },
        { name: 'Ushers & Protocol', description: 'Welcoming congregants, door coordination and seating', leaderName: 'Sister Grace Mensah' },
        { name: 'Media & Technical Desk', description: 'Audio, projection, live stream and digital check-in', leaderName: 'Kofi Boateng' },
        { name: 'Men\'s Fellowship (PEMEM)', description: 'Empowering men in the church and community', leaderName: 'Elder Samuel Ansah' },
        { name: 'Women\'s Fellowship', description: 'Ministry for women spiritual growth and welfare', leaderName: 'Deaconess Mary Appiah' },
        { name: 'Youth Ministry', description: 'Dynamic youth fellowship and leadership', leaderName: 'Pastor Joshua Frimpong' },
        { name: 'Children\'s Ministry', description: 'Sunday School and moral training for children', leaderName: 'Sister Abigail Darko' },
        { name: 'Evangelism & Follow-up', description: 'Soul winning and visitor assimilation', leaderName: 'Brother Daniel Arthur' },
        { name: 'Prayer Warriors', description: 'Intercessory prayers and fasting ministry', leaderName: 'Elder Joseph Kwarteng' }
    ];
    const createdDepartments = {};
    for (const dept of departmentsData) {
        const d = await prisma.department.create({ data: dept });
        createdDepartments[d.name] = d.id;
    }
    // 3. Seed Realistic Church Members with Photos, DOB, Hometown, Marital Status, Occupation
    const membersData = [
        // Group 1 Members
        {
            memberCode: 'CACI-001',
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            firstName: 'Kwame',
            lastName: 'Mensah',
            phone: '+233244112233',
            email: 'kwame.mensah@example.com',
            gender: client_1.Gender.MALE,
            maritalStatus: client_1.MaritalStatus.MARRIED,
            churchGroup: client_1.ChurchGroup.GROUP_1,
            role: 'Elder',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1978-04-15'),
            hometown: 'Kumasi, Ashanti Region',
            occupation: 'Civil Engineer',
            emergencyContactName: 'Akosua Mensah (Wife)',
            emergencyContactPhone: '+233244998877',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'House 14, Ring Road Central, Accra',
            departments: ['Men\'s Fellowship (PEMEM)', 'Prayer Warriors']
        },
        {
            memberCode: 'CACI-002',
            photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
            firstName: 'Abena',
            lastName: 'Osei',
            phone: '+233201234567',
            email: 'abena.osei@example.com',
            gender: client_1.Gender.FEMALE,
            maritalStatus: client_1.MaritalStatus.MARRIED,
            churchGroup: client_1.ChurchGroup.GROUP_1,
            role: 'Deaconess',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1984-08-22'),
            hometown: 'Mampong, Ashanti',
            occupation: 'Educationist / Teacher',
            emergencyContactName: 'Kojo Osei (Husband)',
            emergencyContactPhone: '+233201112233',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'Ashaley Botwe, Accra',
            departments: ['Women\'s Fellowship', 'Choir & Music Ministry']
        },
        {
            memberCode: 'CACI-003',
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            firstName: 'Kofi',
            lastName: 'Boateng',
            phone: '+233245678901',
            email: 'kofi.boateng@example.com',
            gender: client_1.Gender.MALE,
            maritalStatus: client_1.MaritalStatus.SINGLE,
            churchGroup: client_1.ChurchGroup.GROUP_1,
            role: 'Media Lead',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1996-11-03'),
            hometown: 'Nkawkaw, Eastern Region',
            occupation: 'Software Developer & Sound Tech',
            emergencyContactName: 'Mr. Boateng (Father)',
            emergencyContactPhone: '+233245112233',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'Madina Estate',
            departments: ['Media & Technical Desk', 'Youth Ministry']
        },
        {
            memberCode: 'CACI-004',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            firstName: 'Grace',
            lastName: 'Appiah',
            phone: '+233543210987',
            email: 'grace.appiah@example.com',
            gender: client_1.Gender.FEMALE,
            maritalStatus: client_1.MaritalStatus.SINGLE,
            churchGroup: client_1.ChurchGroup.GROUP_1,
            role: 'Usher',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1994-06-18'),
            hometown: 'Cape Coast, Central Region',
            occupation: 'Nurse',
            emergencyContactName: 'Dorothy Appiah (Sister)',
            emergencyContactPhone: '+233543110022',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'Adenta Barrier',
            departments: ['Ushers & Protocol', 'Women\'s Fellowship']
        },
        {
            memberCode: 'CACI-005',
            photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
            firstName: 'Samuel',
            lastName: 'Ansah',
            phone: '+233271122334',
            email: 'samuel.ansah@example.com',
            gender: client_1.Gender.MALE,
            maritalStatus: client_1.MaritalStatus.MARRIED,
            churchGroup: client_1.ChurchGroup.GROUP_1,
            role: 'Elder',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1972-01-10'),
            hometown: 'Koforidua',
            occupation: 'Accountant',
            emergencyContactName: 'Evelyn Ansah',
            emergencyContactPhone: '+233271998877',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'Dome Pillar 2',
            departments: ['Men\'s Fellowship (PEMEM)']
        },
        {
            memberCode: 'CACI-006',
            photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
            firstName: 'Priscilla',
            lastName: 'Agyemang',
            phone: '+233509876543',
            email: 'priscilla.a@example.com',
            gender: client_1.Gender.FEMALE,
            maritalStatus: client_1.MaritalStatus.SINGLE,
            churchGroup: client_1.ChurchGroup.GROUP_1,
            role: 'Member',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1998-09-25'),
            hometown: 'Sunyani, Bono Region',
            occupation: 'Graphic Designer',
            emergencyContactName: 'Mrs. Agyemang',
            emergencyContactPhone: '+233509112233',
            isWaterBaptized: true,
            isHolyGhostBaptized: false,
            address: 'Haatso, Ecomog',
            departments: ['Choir & Music Ministry']
        },
        // Group 2 Members
        {
            memberCode: 'CACI-007',
            photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
            firstName: 'Emmanuel',
            lastName: 'Osei',
            phone: '+233241239876',
            email: 'emmanuel.osei@example.com',
            gender: client_1.Gender.MALE,
            maritalStatus: client_1.MaritalStatus.MARRIED,
            churchGroup: client_1.ChurchGroup.GROUP_2,
            role: 'Music Director',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1982-12-05'),
            hometown: 'Bekwai, Ashanti',
            occupation: 'Music Producer & Lecturer',
            emergencyContactName: 'Vivian Osei',
            emergencyContactPhone: '+233241887766',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'East Legon Hills',
            departments: ['Choir & Music Ministry']
        },
        {
            memberCode: 'CACI-008',
            photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
            firstName: 'Mary',
            lastName: 'Appiah',
            phone: '+233267890123',
            email: 'mary.appiah@example.com',
            gender: client_1.Gender.FEMALE,
            maritalStatus: client_1.MaritalStatus.MARRIED,
            churchGroup: client_1.ChurchGroup.GROUP_2,
            role: 'Deaconess',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1980-03-30'),
            hometown: 'Akim Oda',
            occupation: 'Business Executive',
            emergencyContactName: 'Elder Joseph Appiah',
            emergencyContactPhone: '+233267112233',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'Spintex Road, Batsonaa',
            departments: ['Women\'s Fellowship', 'Children\'s Ministry']
        },
        {
            memberCode: 'CACI-009',
            photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
            firstName: 'Joshua',
            lastName: 'Frimpong',
            phone: '+233549012345',
            email: 'joshua.frimpong@example.com',
            gender: client_1.Gender.MALE,
            maritalStatus: client_1.MaritalStatus.MARRIED,
            churchGroup: client_1.ChurchGroup.GROUP_2,
            role: 'Youth Pastor',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1988-07-14'),
            hometown: 'Abetifi Kwahu',
            occupation: 'Pastor & Youth Counselor',
            emergencyContactName: 'Lady Pastor Frimpong',
            emergencyContactPhone: '+233549998877',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'Airport Residential Area',
            departments: ['Youth Ministry', 'Media & Technical Desk']
        },
        {
            memberCode: 'CACI-010',
            photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
            firstName: 'Abigail',
            lastName: 'Darko',
            phone: '+233208765432',
            email: 'abigail.darko@example.com',
            gender: client_1.Gender.FEMALE,
            maritalStatus: client_1.MaritalStatus.SINGLE,
            churchGroup: client_1.ChurchGroup.GROUP_2,
            role: 'Sunday School Lead',
            status: client_1.MemberStatus.ACTIVE,
            dateOfBirth: new Date('1992-05-20'),
            hometown: 'Akropong Akuapem',
            occupation: 'Pharmacist',
            emergencyContactName: 'Dr. Darko',
            emergencyContactPhone: '+233208112233',
            isWaterBaptized: true,
            isHolyGhostBaptized: true,
            address: 'Tema Community 25',
            departments: ['Children\'s Ministry']
        }
    ];
    const createdMembers = [];
    for (const m of membersData) {
        const { departments, ...memberFields } = m;
        const created = await prisma.member.create({
            data: {
                ...memberFields,
                notes: 'Committed member of CACI'
            }
        });
        createdMembers.push(created);
        for (const deptName of departments) {
            const deptId = createdDepartments[deptName];
            if (deptId) {
                await prisma.memberDepartment.create({
                    data: {
                        memberId: created.id,
                        departmentId: deptId
                    }
                });
            }
        }
    }
    // 4. Seed Service Sessions (Without Sunday 1st/2nd service, with Friday Prayer Night)
    const baseDate = new Date();
    baseDate.setHours(8, 30, 0, 0);
    const sessionDefinitions = [
        { offset: 0, type: 'Sunday Divine Worship Service', theme: 'Walking in Supernatural Favor' },
        { offset: 2, type: 'Friday Prayer Night', theme: 'Breaking Generational Barriers' },
        { offset: 4, type: 'Midweek Teaching & Prayer Service', theme: 'The Believer\'s Authority' },
        { offset: 7, type: 'Sunday Divine Worship Service', theme: 'The God of Breakthroughs' }
    ];
    const sessions = [];
    for (const def of sessionDefinitions) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - def.offset);
        const s = await prisma.serviceSession.create({
            data: {
                serviceDate: d,
                serviceType: def.type,
                theme: def.theme,
                notes: `Sanctuary service - ${d.toDateString()}`
            }
        });
        sessions.push(s);
    }
    // 5. Seed Attendance Records
    const activeSession = sessions[0];
    for (let sIdx = 0; sIdx < sessions.length; sIdx++) {
        const sess = sessions[sIdx];
        const attendees = createdMembers.slice(0, 6 + (sIdx % 4));
        for (const member of attendees) {
            await prisma.attendanceRecord.create({
                data: {
                    sessionId: sess.id,
                    memberId: member.id,
                    markedBy: 'Media Desk Laptop'
                }
            });
        }
    }
    // 6. Seed Financial Contributions (With transactionDate, without refCode)
    const finRecords = [
        {
            memberId: createdMembers[0].id,
            sessionId: activeSession.id,
            category: client_1.FinancialCategory.TITHE,
            amount: 750.00,
            paymentMethod: client_1.PaymentMethod.MOBILE_MONEY,
            transactionDate: activeSession.serviceDate,
            notes: 'March 2026 Tithe'
        },
        {
            memberId: createdMembers[1].id,
            sessionId: activeSession.id,
            category: client_1.FinancialCategory.TITHE,
            amount: 500.00,
            paymentMethod: client_1.PaymentMethod.CASH,
            transactionDate: activeSession.serviceDate,
            notes: 'Tithe envelope'
        },
        {
            memberId: createdMembers[6].id,
            sessionId: activeSession.id,
            category: client_1.FinancialCategory.TITHE,
            amount: 600.00,
            paymentMethod: client_1.PaymentMethod.MOBILE_MONEY,
            transactionDate: activeSession.serviceDate,
            notes: 'Tithe'
        },
        {
            memberId: null,
            sessionId: activeSession.id,
            category: client_1.FinancialCategory.OFFERING,
            amount: 3200.00,
            paymentMethod: client_1.PaymentMethod.CASH,
            transactionDate: activeSession.serviceDate,
            notes: 'Sunday open offering collection'
        }
    ];
    for (const fin of finRecords) {
        await prisma.financialContribution.create({ data: fin });
    }
    console.log('Seeded CACI enterprise church database with refined human data!');
}
main()
    .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
