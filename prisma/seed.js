const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    //Clear existing data
    await prisma.post.deleteMany();
    await prisma.companyMember.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    const hashedPassword1 = await bcrypt.hash('Password123!', 10);
    const hashedPassword2 = await bcrypt.hash('SecurePass456!', 10);

    const sarah = await prisma.user.create({
        data: {
            id: 'user-1',
            email: 'sarah@example.com',
            password: hashedPassword1,
            fullName: 'Sarah Johnson',
        },
    });

    const mike = await prisma.user.create({
        data: {
            id: 'user-2',
            email: 'mike@example.com',
            password: hashedPassword2,
            fullName: 'Mike Chen',
        },
    });

    console.log('✅ Created users');

    // Create companies
    const acmeCorp = await prisma.company.create({
        data: {
            id: 'company-1',
            name: 'Acme Corp',
            description: 'Innovative solutions for modern businesses',
        },
    });

    const techStart = await prisma.company.create({
        data: {
            id: 'company-2',
            name: 'TechStart Inc',
            description: 'Startup accelerator and venture capital',
        },
    });

    const globalSolutions = await prisma.company.create({
        data: {
            id: 'company-3',
            name: 'Global Solutions',
            description: 'Enterprise consulting services',
        },
    });

    console.log('✅ Created companies');

    // Create company memberships
    await prisma.companyMember.create({
        data: {
            userId: sarah.id,
            companyId: acmeCorp.id,
            role: 'admin',
        },
    });

    await prisma.companyMember.create({
        data: {
            userId: sarah.id,
            companyId: techStart.id,
            role: 'member',
        },
    });

    await prisma.companyMember.create({
        data: {
            userId: mike.id,
            companyId: acmeCorp.id,
            role: 'member',
        },
    });

    await prisma.companyMember.create({
        data: {
            userId: mike.id,
            companyId: techStart.id,
            role: 'admin',
        },
    });

    console.log('✅ Created company memberships');

    // Create sample post
    await prisma.post.create({
        data: {
            companyId: acmeCorp.id,
            date: new Date().toISOString().split('T')[0],
            platform: 'LinkedIn',
            postType: 'Announcement',
            title: 'Welcome to Social Media Manager',
            notes: 'This is a sample post seeded in the database.',
            status: 'Planned',
            createdBy: sarah.id,
        },
    });
    console.log('✅ Created sample post');

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('Demo credentials:');
    console.log('  Sarah: sarah@example.com / Password123!');
    console.log('  Mike:  mike@example.com / SecurePass456!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
