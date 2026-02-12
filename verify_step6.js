const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-12345-change-me';

async function main() {
    console.log('DB URL:', process.env.DATABASE_URL);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    console.log('--- Step 6 Verification ---');

    // 1. Find or Create an Approved Post
    let post = await prisma.post.findFirst({ where: { status: 'APPROVED' } });
    if (!post) {
        console.log('No approved post found. Creating one...');
        const company = await prisma.company.findFirst();
        const user = await prisma.user.findFirst();
        post = await prisma.post.create({
            data: {
                companyId: company.id,
                date: '2026-03-01',
                platform: 'Instagram',
                postType: 'Promo',
                title: 'Test Step 6',
                status: 'APPROVED',
                createdBy: user.id
            }
        });
    }

    // 2. Authenticate
    const membership = await prisma.companyMember.findFirst({ where: { companyId: post.companyId } });
    const user = await prisma.user.findUnique({ where: { id: membership.userId } });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    const baseUrl = 'http://localhost:3000';

    // 3. Test Scheduling
    console.log(`Testing Scheduling for Post: ${post.id}`);
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 5);
    const scheduleRes = await fetch(`${baseUrl}/api/posts/${post.id}/schedule`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scheduledAt: scheduleDate.toISOString() })
    });
    console.log(`- Schedule Status: ${scheduleRes.status} (Expected: 200) ${scheduleRes.status === 200 ? '✅' : '❌'}`);
    if (scheduleRes.status === 200) {
        const data = await scheduleRes.json();
        console.log(`- New Status: ${data.data.status} ✅`);
    } else {
        const err = await scheduleRes.json();
        console.log(`- Error: ${err.error} ❌`);
    }

    // 4. Test Publishing
    console.log(`Testing Publishing for Post: ${post.id}`);
    const publishRes = await fetch(`${baseUrl}/api/posts/${post.id}/publish`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ publishedUrl: 'https://instagram.com/p/test' })
    });
    console.log(`- Publish Status: ${publishRes.status} (Expected: 200) ${publishRes.status === 200 ? '✅' : '❌'}`);
    if (publishRes.status === 200) {
        const data = await publishRes.json();
        console.log(`- New Status: ${data.data.status} ✅`);
        console.log(`- Published URL: ${data.data.publishedUrl} ✅`);
    } else {
        const err = await publishRes.json();
        console.log(`- Error: ${err.error} ❌`);
    }

    await prisma.$disconnect();
}

main().catch(console.error);
