const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function checkData() {
    console.log('\n=== USERS ===');
    const users = await prisma.user.findMany();
    users.forEach(u => console.log(`${u.id}: ${u.email} (${u.fullName})`));

    console.log('\n=== COMPANIES ===');
    const companies = await prisma.company.findMany();
    companies.forEach(c => console.log(`${c.id}: ${c.name}`));

    console.log('\n=== COMPANY MEMBERS ===');
    const members = await prisma.companyMember.findMany({
        include: {
            user: true,
            company: true,
        }
    });
    members.forEach(m => console.log(`${m.user.email} -> ${m.company.name} (${m.role})`));

    console.log('\n=== TESTING MEMBERSHIP CHECK ===');
    // Test the exact function used in the API
    const isUserMemberOfCompany = async (userId, companyId) => {
        const count = await prisma.companyMember.count({
            where: {
                userId,
                companyId,
            },
        });
        return count > 0;
    };

    const tests = [
        { userId: 'user-1', companyId: 'company-1', expected: true },
        { userId: 'user-1', companyId: 'company-2', expected: true },
        { userId: 'user-1', companyId: 'company-3', expected: false },
        { userId: 'user-2', companyId: 'company-1', expected: true },
        { userId: 'user-2', companyId: 'company-2', expected: true },
    ];

    for (const test of tests) {
        const result = await isUserMemberOfCompany(test.userId, test.companyId);
        const status = result === test.expected ? '✅' : '❌';
        console.log(`${status} User ${test.userId} in ${test.companyId}: ${result} (expected: ${test.expected})`);
    }

    await prisma.$disconnect();
}

checkData().catch(console.error);
