export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(
    request: NextRequest,
    { params }: { params: { companyId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let payload;
        try {
            payload = verifyToken(token);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const { companyId } = params;

        // Check if user is ADMIN of company
        const membership = await prisma.companyMember.findUnique({
            where: {
                userId_companyId: { userId: payload.userId, companyId }
            }
        });

        if (!membership || membership.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Only admins can invite members' }, { status: 403 });
        }

        const body = await request.json();
        const { email, role } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        // Check if user is already a member
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            const isMember = await prisma.companyMember.findUnique({
                where: { userId_companyId: { userId: existingUser.id, companyId } }
            });
            if (isMember) {
                return NextResponse.json({ success: false, error: 'User is already a member' }, { status: 400 });
            }
        }

        // Check if invitation already exists (upsert logic)
        const existingInvite = await prisma.invitation.findUnique({
            where: { email_companyId: { email, companyId } }
        });

        const inviteToken = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        let invitation;
        if (existingInvite) {
            invitation = await prisma.invitation.update({
                where: { id: existingInvite.id },
                data: {
                    token: inviteToken,
                    expiresAt,
                    role: role || existingInvite.role
                }
            });
        } else {
            invitation = await prisma.invitation.create({
                data: {
                    email,
                    companyId,
                    role: role || 'VIEWER',
                    token: inviteToken,
                    expiresAt,
                    invitedBy: payload.userId
                }
            });
        }

        // In a real app, send email here. For MVP, return token.
        // Assuming app runs on localhost:3000 if not specified
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        return NextResponse.json({
            success: true,
            data: {
                invitation,
                inviteUrl: `${baseUrl}/invite/${inviteToken}`
            }
        });

    } catch (error: any) {
        console.error('Invite error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
