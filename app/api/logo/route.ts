export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/upload';

export async function POST(request: NextRequest) {
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
            return NextResponse.json({ success: false, error: 'Only admins can update logo' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        // Save file
        const { url } = await saveFile(file, 'logos');

        // Update brand profile (removed upsert for HTTP adapter compatibility)
        const existingProfile = await prisma.brandProfile.findUnique({
            where: { companyId }
        });

        if (existingProfile) {
            await prisma.brandProfile.update({
                where: { companyId },
                data: { logoUrl: url }
            });
        } else {
            await prisma.brandProfile.create({
                data: {
                    companyId,
                    industry: '',
                    targetAudience: '',
                    tone: '',
                    language: 'English (EN)',
                    products: '',
                    uvp: '',
                    primaryColor: '#4F46E5',
                    secondaryColor: '#FFFFFF',
                    accentColor: '#111827',
                    logoUrl: url
                }
            });
        }

        return NextResponse.json({ success: true, url });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

