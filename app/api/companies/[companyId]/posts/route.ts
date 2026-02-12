export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany, Platform, PostStatus, PostType } from '@/lib/db';
import { getCompanyPosts, createPost } from '@/lib/posts';
import { createPostSchema, formatZodErrors } from '@/lib/postValidation';

// GET /api/companies/:companyId/posts
export async function GET(
    request: NextRequest,
    { params }: { params: { companyId: string } }
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

        const companyId = params.companyId;

        // Verify user is member of company
        const isMember = await isUserMemberOfCompany(payload.userId, companyId);
        if (!isMember) {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Not a member of this company' },
                { status: 403 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const platform = searchParams.get('platform');
        const status = searchParams.get('status');

        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'startDate and endDate are required' },
                { status: 400 }
            );
        }

        // Fetch posts
        const posts = await getCompanyPosts(companyId, startDate, endDate, {
            platform: platform || undefined,
            status: status || undefined,
        });

        return NextResponse.json({
            success: true,
            data: posts,
        });
    } catch (error) {
        console.error('Get posts error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/companies/:companyId/posts
export async function POST(
    request: NextRequest,
    { params }: { params: { companyId: string } }
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

        const companyId = params.companyId;

        // Detailed logging for debugging membership issues
        console.log('🔍 [CREATE POST] Checking membership:', {
            companyId,
            userId: payload.userId,
            userEmail: payload.email,
        });

        // Verify user is member of company
        const isMember = await isUserMemberOfCompany(payload.userId, companyId);
        console.log(`🔍 [CREATE POST] Membership check result: ${isMember}`);

        if (!isMember) {
            console.error('❌ [CREATE POST] 403 Forbidden:', {
                reason: 'User is not a member of this company',
                userId: payload.userId,
                userEmail: payload.email,
                companyId,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: 'Forbidden: Not a member of this company',
                    details: {
                        userId: payload.userId,
                        companyId: companyId,
                        hint: 'Please switch to a company you are a member of or contact your admin',
                    }
                },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = createPostSchema.safeParse(body);

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

        const { date, platform, postType, title, notes, status } = validation.data;

        // Create post
        const newPost = await createPost({
            companyId,
            date,
            platform, // Assuming string compatibility or exact match
            postType,
            title,
            notes,
            status: status || 'PLANNED',
            createdBy: payload.userId,
        });

        return NextResponse.json(
            {
                success: true,
                data: newPost,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create post error details:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
