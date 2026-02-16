export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findPostById } from '@/lib/posts';
import { getMemberRole } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const postId = params.postId;
        const review = await prisma.postReview.findFirst({
            where: { postId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: review,
        });
    } catch (error) {
        console.error('Fetch review history error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
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
        const postId = params.postId;

        const post = await findPostById(postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        const userRole = await getMemberRole(payload.userId, post.companyId);
        if (!userRole || !['ADMIN', 'EDITOR'].includes(userRole)) {
            return NextResponse.json({ success: false, error: 'Only ADMIN/EDITOR can change status' }, { status: 403 });
        }

        const body = await request.json();
        const { newStatus, comment } = body;

        const validStatuses = ['DRAFT', 'PLANNED', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'CHANGES_REQUESTED', 'PENDING_REVIEW', 'REJECTED'];
        if (!validStatuses.includes(newStatus)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        // Note: Removed transaction for HTTP adapter compatibility on Vercel
        const oldStatus = post.status;

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { status: newStatus },
        });

        const history = await prisma.postStatusHistory.create({
            data: {
                postId,
                oldStatus,
                newStatus,
                byUserId: payload.userId,
                comment: comment || null,
            },
        });

        let review = null;
        // Also add for reviews if it's an approval/rejection/changes logic
        if (['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(newStatus)) {
            review = await prisma.postReview.create({
                data: {
                    postId,
                    status: newStatus,
                    reviewerId: payload.userId,
                    comment: comment || (newStatus === 'APPROVED' ? 'Approved by Editor' : 'Feedback provided'),
                }
            });
        }

        const result = review || { status: newStatus, ...history };

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Workflow transition error:', error);
        return NextResponse.json({ success: false, error: 'Transition failed' }, { status: 500 });
    }
}
