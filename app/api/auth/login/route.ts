import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { loginSchema, formatZodErrors } from '@/lib/validation';
import { findUserByEmail } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = loginSchema.safeParse(body);
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

        const { email, password } = validation.data;

        // Find user
        const user = await findUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid email or password',
                },
                { status: 401 }
            );
        }

        // Verify password
        // Use user.password from Prisma (was passwordHash in mock)
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid email or password',
                },
                { status: 401 }
            );
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        // Return success
        return NextResponse.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    // avatar: user.avatar, // Removed as not in Prisma yet
                },
            },
        });
    } catch (error: any) {
        console.error('[AUTH_LOGIN_ERROR] Full details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause,
            dbUrlExists: !!process.env.DATABASE_URL,
            dbUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
