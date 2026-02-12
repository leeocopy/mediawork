import { prisma } from './lib/prisma';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-12345-change-me';

async function main() {
    console.log('--- Step 6 Verification (TS) ---');

    console.log('🔄 Checking Prisma client instance...');
    // Log if helper models exist on the client instance
    console.log('Client has post:', !!(prisma as any).post);
    console.log('Client has postActivity:', !!(prisma as any).postActivity);

    // 1. Find or Create an Approved Post
    let post = await prisma.post.findFirst({ where: { status: 'APPROVED' } });
    if (!post) {
        console.log('No approved post found. Creating one...');
        const company = await prisma.company.findFirst();
        const user = await prisma.user.findFirst();
        if (!company || !user) {
            console.error('❌ No company/user found. Please ensure database is seeded.');
            return;
        }
        post = await prisma.post.create({
            data: {
                companyId: company.id,
                date: '2026-03-01',
                platform: 'Instagram',
                postType: 'Promo',
                title: 'Test Step 6 TS',
                status: 'APPROVED',
                createdBy: user.id
            }
        });
    }

    // 2. Authenticate
    const membership = await prisma.companyMember.findFirst({ where: { companyId: post.companyId } });
    if (!membership) throw new Error('No membership found for post company');

    const user = await prisma.user.findUnique({ where: { id: membership.userId } });
    if (!user) throw new Error('User not found');

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    const baseUrl = 'http://localhost:3000';

    // 3. Test Scheduling
    console.log(`Testing Scheduling for Post: ${post.id}`);
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 5);

    // Check if we can update directly via prisma first to verify schema connectivity
    try {
        console.log('Attempting direct DB update for scheduledAt...');
        await prisma.post.update({
            where: { id: post.id },
            data: { scheduledAt: scheduleDate }
        });
        console.log('✅ Direct DB update success');
    } catch (e: any) {
        console.error('❌ Direct DB update failed:', e.message);
    }

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
        body: JSON.stringify({ publishedUrl: 'https://instagram.com/p/test-ts' })
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
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
