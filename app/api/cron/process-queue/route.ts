export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // In a real app, verify a CRON_SECRET header
        // const secret = request.headers.get('x-cron-secret');
        // if (secret !== process.env.CRON_SECRET) return ...

        const now = new Date();

        // Find posts that are SCHEDULED for now or earlier
        const scheduledPosts = await prisma.post.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: {
                    lte: now
                }
            }
        });

        const results = [];

        for (const post of scheduledPosts) {
            // 1. Simulate API call to Meta/LinkedIn
            console.log(`[QUEUE] Publishing post ${post.id} to ${post.platform}...`);

            // 2. Update post status
            const updated = await prisma.post.update({
                where: { id: post.id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: now,
                    publishedUrl: `https://mock-social.com/p/${post.id}`
                }
            });

            // 3. Add to history
            await prisma.postStatusHistory.create({
                data: {
                    postId: post.id,
                    oldStatus: 'SCHEDULED',
                    newStatus: 'PUBLISHED',
                    byUserId: 'SYSTEM',
                    comment: 'Post automatically published by scheduler.'
                }
            });

            results.push({ id: post.id, status: 'PUBLISHED' });
        }

        return NextResponse.json({
            success: true,
            processedCount: results.length,
            details: results
        });

    } catch (error) {
        console.error('Queue processing error:', error);
        return NextResponse.json({ success: false, error: 'Queue failed' }, { status: 500 });
    }
}

