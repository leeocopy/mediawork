import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { signupSchema, formatZodErrors } from '@/lib/validation';
import { findUserByEmail, createUser } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Direct prisma access for transaction if needed

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = signupSchema.safeParse(body);
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

        const { email, password, fullName } = validation.data;

        // Check if user already exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: {
                        email: 'Email already registered',
                    },
                },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const newUser = await createUser({
            email: email.toLowerCase(),
            passwordHash,
            fullName,
        });

        // Auto-create a personal workspace
        const company = await prisma.company.create({
            data: {
                name: `${fullName}'s Workspace`,
                description: 'Your personal workspace',
            },
        });

        // Add user as admin
        await prisma.companyMember.create({
            data: {
                userId: newUser.id,
                companyId: company.id,
                role: 'admin',
            },
        });

        // Generate token
        const token = generateToken({
            userId: newUser.id,
            email: newUser.email,
        });

        // Return success
        return NextResponse.json(
            {
                success: true,
                data: {
                    token,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        fullName: newUser.fullName,
                        // avatar: newUser.avatar, // Not in Prisma yet
                    },
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[AUTH_SIGNUP_ERROR] Full details:', {
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
