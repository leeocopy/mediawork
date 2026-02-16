export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserCompanies } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required',
                },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token
        let payload;
        try {
            payload = verifyToken(token);
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid or expired token',
                },
                { status: 401 }
            );
        }

        // Get user's companies
        const companies = await getUserCompanies(payload.userId);

        // Return companies
        return NextResponse.json({
            success: true,
            data: companies,
        });
    } catch (error) {
        console.error('Get companies error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let payload;
        try {
            payload = verifyToken(token);
        } catch (error) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
        }

        // Validate input
        const { name, industry } = await request.json();
        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Company name must be at least 2 characters' },
                { status: 400 }
            );
        }

        // Create company, membership, and initial brand profile (removed transaction for HTTP adapter compatibility)
        const company = await prisma.company.create({
            data: {
                name: name.trim(),
            },
        });

        await prisma.companyMember.create({
            data: {
                companyId: company.id,
                userId: payload.userId,
                role: 'ADMIN',
            },
        });

        // Create initial brand profile
        await prisma.brandProfile.create({
            data: {
                companyId: company.id,
                industry: industry || '',
                targetAudience: '',
                tone: 'Professional',
                language: 'EN',
                products: '',
                uvp: '',
            }
        });

        const result = company;

        return NextResponse.json({
            success: true,
            data: { company: result },
        });
    } catch (error: any) {
        console.error('POST /api/companies error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

