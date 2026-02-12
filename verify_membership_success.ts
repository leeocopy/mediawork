import { prisma } from './lib/prisma';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-12345-change-me';

async function main() {
    console.log('--- Debug Membership Success ---');

    // 1. Get User Sarah
    const user = await prisma.user.findFirst({ where: { email: 'sarah@example.com' } });
    if (!user) throw new Error('Sarah not found');
    console.log('User:', user.email, user.id);

    // 2. Get Company Acme
    const company = await prisma.company.findFirst({ where: { name: 'Acme Corp' } });
    if (!company) throw new Error('Acme Corp not found');
    console.log('Company:', company.name, company.id);

    // 3. Verify Membership in DB
    const member = await prisma.companyMember.findUnique({
        where: { userId_companyId: { userId: user.id, companyId: company.id } }
    });
    console.log('Membership in DB:', !!member);

    // 4. Generate Token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    // 5. Try to Create Post via API
    const baseUrl = 'http://localhost:3000';
    console.log(`\nPOST ${baseUrl}/api/companies/${company.id}/posts`);

    const postData = {
        date: '2026-03-25',
        platform: 'Instagram',
        postType: 'Promo',
        title: 'Allowed Post',
        notes: 'Testing creation for member',
        status: 'PLANNED'
    };

    const res = await fetch(`${baseUrl}/api/companies/${company.id}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
    });

    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (res.ok) {
        console.log('✅ Post Created successfully!');
        if (data.data?.id) await prisma.post.delete({ where: { id: data.data.id } });
    } else {
        console.error('❌ Failed!', data.error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
