export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const jwtToken = authHeader.replace('Bearer ', '');
        let payload;
        try {
            payload = verifyToken(jwtToken);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid auth token' }, { status: 401 });
        }

        const { token } = params;

        // Find invitation
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { company: true }
        });

        if (!invitation) {
            return NextResponse.json({ success: false, error: 'Invalid invitation' }, { status: 404 });
        }

        if (invitation.expiresAt < new Date()) {
            return NextResponse.json({ success: false, error: 'Invitation expired' }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

        // Normalize emails
        if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
            return NextResponse.json({
                success: false,
                error: `This invitation is for ${invitation.email}, but you are logged in as ${user.email}. Please switch accounts.`
            }, { status: 403 });
        }

        // Add to company (removed transaction for HTTP adapter compatibility)
        // Check if already member (double check)
        const member = await prisma.companyMember.findUnique({
            where: { userId_companyId: { userId: user.id, companyId: invitation.companyId } }
        });

        if (!member) {
            await prisma.companyMember.create({
                data: {
                    userId: user.id,
                    companyId: invitation.companyId,
                    role: invitation.role
                }
            });
        }

        // Delete invitation
        await prisma.invitation.delete({ where: { id: invitation.id } });

        return NextResponse.json({
            success: true,
            message: `Joined ${invitation.company.name} successfully`,
            companyId: invitation.companyId
        });

    } catch (error: any) {
        console.error('Accept invite error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
