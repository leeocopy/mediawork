import { prisma } from './lib/prisma';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-12345-change-me';

async function main() {
    console.log('--- Debug Membership ---');

    // 1. Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach((u: any) => console.log(`- ${u.id} / ${u.email}`));

    // 2. Get all companies
    const companies = await prisma.company.findMany();
    console.log(`\nFound ${companies.length} companies:`);
    companies.forEach((c: any) => console.log(`- ${c.id} / ${c.name}`));

    // 3. Get all memberships
    const memberships = await prisma.companyMember.findMany({
        include: { user: true, company: true }
    });
    console.log(`\nFound ${memberships.length} memberships:`);
    memberships.forEach((m: any) => console.log(`- User: ${m.user.email} -> Company: ${m.company.name} (${m.role})`));

    // 4. Check for orphans or issues
    if (users.length > 0 && companies.length > 0) {
        if (memberships.length === 0) {
            console.error('\n❌ CRITICAL: No memberships found! Users act as ghosts.');
        } else {
            console.log('\n✅ Memberships exist.');
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
