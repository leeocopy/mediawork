export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { findPostById } from '@/lib/posts';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        const { publishedAt, publishedUrl } = await request.json();

        // 1. Get Post
        const post = await findPostById(params.postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        // 2. Verify Member
        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // 3. Status must be APPROVED or SCHEDULED
        if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED' && post.status !== 'PUBLISHED') {
            return NextResponse.json({ success: false, error: 'Only APPROVED or SCHEDULED posts can be marked as published' }, { status: 400 });
        }

        // 4. Update
        // Note: Removed transaction for HTTP adapter compatibility on Vercel
        const updatedPost = await prisma.post.update({
            where: { id: params.postId },
            data: {
                status: 'PUBLISHED',
                publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
                publishedUrl: publishedUrl || null,
            }
        });

        await prisma.postActivity.create({
            data: {
                postId: params.postId,
                userId: payload.userId,
                action: 'PUBLISHED',
                details: publishedUrl ? `Published to ${publishedUrl}` : 'Marked as published',
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedPost
        });
    } catch (error: any) {
        console.error('Publish error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
