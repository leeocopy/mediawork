export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { companyId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        const isMember = await isUserMemberOfCompany(payload.userId, params.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const where: any = {
            companyId: params.companyId,
            status: 'APPROVED',
        };

        if (from && to) {
            where.date = {
                gte: from,
                lte: to,
            };
        }

        const approvedPosts = await prisma.post.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            data: approvedPosts,
        });
    } catch (error: any) {
        console.error('Fetch approved posts error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
