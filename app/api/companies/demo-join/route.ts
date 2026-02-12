export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findOrCreateDemoCompany, addUserToCompany, getUserCompanies } from '@/lib/db';

export async function POST(request: NextRequest) {
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

        // Find or create demo company
        const demoCompany = await findOrCreateDemoCompany();

        if (!demoCompany) {
            throw new Error("Failed to create demo company");
        }

        // Add user to demo company
        await addUserToCompany(payload.userId, demoCompany.id, 'admin');

        // Return updated companies list
        const companies = await getUserCompanies(payload.userId);

        return NextResponse.json({
            success: true,
            message: 'Successfully joined Demo Company',
            data: companies,
        });
    } catch (error) {
        console.error('Demo join error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}

