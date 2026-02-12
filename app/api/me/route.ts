import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findUserById, getUserCompanies } from '@/lib/db';

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

        // Get user
        const user = await findUserById(payload.userId);
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not found',
                },
                { status: 404 }
            );
        }

        // Get user's companies and memberships
        const companies = await getUserCompanies(payload.userId);

        // Format memberships for debugging
        const memberships = companies.map(c => ({
            companyId: c.id,
            companyName: c.name,
            role: c.userRole,
        }));

        // Return user data with memberships
        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                memberships,
            },
        });
    } catch (error) {
        console.error('GET /api/me error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
