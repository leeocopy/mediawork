import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);
        const guidelineId = params.id;

        // Find the guideline
        const guideline = await prisma.brandGuideline.findUnique({
            where: { id: guidelineId }
        });

        if (!guideline) {
            return NextResponse.json({ success: false, error: 'Guideline not found' }, { status: 404 });
        }

        // Verify membership and ADMIN role in the company the guideline belongs to
        const membership = await prisma.companyMember.findUnique({
            where: {
                userId_companyId: { userId: payload.userId, companyId: guideline.companyId }
            }
        });

        if (!membership || membership.role.toUpperCase() !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Only admins can delete guidelines' }, { status: 403 });
        }

        // Delete from DB
        await prisma.brandGuideline.delete({
            where: { id: guidelineId }
        });

        // Optionally delete file from disk (MVP: local storage)
        try {
            const filePath = join(process.cwd(), 'public', guideline.fileUrl.replace(/^\//, ''));
            await unlink(filePath);
        } catch (e) {
            console.warn('Failed to delete file from disk:', e);
        }

        return NextResponse.json({ success: true, message: 'Guideline deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
