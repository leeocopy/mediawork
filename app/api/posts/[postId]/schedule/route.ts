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

        const { scheduledAt } = await request.json();

        if (!scheduledAt) {
            return NextResponse.json({ success: false, error: 'scheduledAt is required' }, { status: 400 });
        }

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

        // 3. Status must be APPROVED or SCHEDULED (to reschedule)
        if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED') {
            return NextResponse.json({ success: false, error: 'Only APPROVED posts can be scheduled' }, { status: 400 });
        }

        // 4. Update
        const updatedPost = await prisma.$transaction(async (tx: any) => {
            const up = await (tx as any).post.update({
                where: { id: params.postId },
                data: {
                    status: 'SCHEDULED',
                    scheduledAt: new Date(scheduledAt),
                }
            });

            await (tx as any).postActivity.create({
                data: {
                    postId: params.postId,
                    userId: payload.userId,
                    action: 'SCHEDULED',
                    details: `Scheduled for ${new Date(scheduledAt).toLocaleString()}`,
                }
            });

            return up;
        });

        return NextResponse.json({
            success: true,
            data: updatedPost
        });
    } catch (error: any) {
        console.error('Schedule error detail:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
