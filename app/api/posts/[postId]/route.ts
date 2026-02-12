import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { findPostById, updatePost, deletePost } from '@/lib/posts';
import { updatePostSchema, formatZodErrors } from '@/lib/postValidation';

// GET /api/posts/:postId
export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        let payload;
        try {
            payload = verifyToken(token);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Find post
        const post = await findPostById(params.postId);
        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            );
        }

        // Verify user is member of the company
        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Not a member of this company' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: post,
        });
    } catch (error) {
        console.error('Get post error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/posts/:postId
export async function PUT(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        let payload;
        try {
            payload = verifyToken(token);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Find post
        const post = await findPostById(params.postId);
        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            );
        }

        // Verify user is member of the company
        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Not a member of this company' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = updatePostSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: formatZodErrors(validation.error),
                },
                { status: 400 }
            );
        }

        // Update post
        const updatedPost = await updatePost(params.postId, {
            ...validation.data,
            // Cast types to string/undefined as needed, though generated types match strings
            platform: validation.data.platform,
            postType: validation.data.postType,
            status: validation.data.status,
        });

        if (!updatedPost) {
            return NextResponse.json(
                { success: false, error: 'Failed to update post' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedPost,
        });
    } catch (error) {
        console.error('Update post error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/posts/:postId
export async function DELETE(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        let payload;
        try {
            payload = verifyToken(token);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Find post
        const post = await findPostById(params.postId);
        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Post not found' },
                { status: 404 }
            );
        }

        // Verify user is member of the company
        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Not a member of this company' },
                { status: 403 }
            );
        }

        // Delete post
        const deleted = await deletePost(params.postId);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Failed to delete post' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Post deleted successfully',
        });
    } catch (error) {
        console.error('Delete post error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
