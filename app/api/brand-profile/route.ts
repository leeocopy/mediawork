export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        const companyId = request.nextUrl.searchParams.get('companyId');
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
        }

        // Verify membership
        const membership = await prisma.companyMember.findUnique({
            where: {
                userId_companyId: { userId: payload.userId, companyId }
            }
        });

        if (!membership) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // Get brand profile
        const brandProfile = await prisma.brandProfile.findUnique({
            where: { companyId }
        });

        const guidelines = await prisma.brandGuideline.findMany({
            where: { companyId }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...brandProfile,
                guidelines
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        const companyId = request.nextUrl.searchParams.get('companyId');
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
        }

        // Verify membership and ADMIN role
        const membership = await prisma.companyMember.findUnique({
            where: {
                userId_companyId: { userId: payload.userId, companyId }
            }
        });

        if (!membership || membership.role.toUpperCase() !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Only admins can edit brand profile' }, { status: 403 });
        }

        const body = await request.json();

        const updated = await prisma.brandProfile.upsert({
            where: { companyId },
            update: {
                industry: body.industry,
                targetAudience: body.targetAudience,
                tone: body.tone,
                language: body.language,
                products: body.products,
                uvp: body.uvp,
                primaryColor: body.primaryColor,
                secondaryColor: body.secondaryColor,
                accentColor: body.accentColor,
                fontFamily: body.fontFamily,
                fontStyle: body.fontStyle,
                tagline: body.tagline,
                companyDescription: body.companyDescription,
                websiteUrl: body.websiteUrl,
                instagramHandle: body.instagramHandle,
                doUseWords: body.doUseWords,
                dontUseWords: body.dontUseWords,
                emojiUsage: body.emojiUsage,
            },
            create: {
                companyId,
                industry: body.industry || '',
                targetAudience: body.targetAudience || '',
                tone: body.tone || 'Professional',
                language: body.language || 'EN',
                products: body.products || '',
                uvp: body.uvp || '',
                primaryColor: body.primaryColor || '#4F46E5',
                secondaryColor: body.secondaryColor,
                accentColor: body.accentColor,
                fontFamily: body.fontFamily,
                fontStyle: body.fontStyle,
                tagline: body.tagline,
                companyDescription: body.companyDescription,
                websiteUrl: body.websiteUrl,
                instagramHandle: body.instagramHandle,
                doUseWords: body.doUseWords,
                dontUseWords: body.dontUseWords,
                emojiUsage: body.emojiUsage || 'light',
            }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

