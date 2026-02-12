import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { findPostById, findAssetById } from '@/lib/posts';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string, assetId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let payload;
        try {
            payload = verifyToken(token);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
        }

        const asset = await findAssetById(params.assetId);
        if (!asset || asset.postId !== params.postId) {
            return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });
        }

        const post = await findPostById(params.postId);
        if (!post || !post.companyId) { // Added safety check for companyId
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const filePath = join(process.cwd(), 'uploads', asset.fileUrl); // asset.fileUrl contains the UUID filename

        const inline = request.nextUrl.searchParams.get('inline') === 'true';

        try {
            const fileBuffer = await readFile(filePath);
            const headers: any = {
                'Content-Type': asset.fileType,
            };

            if (!inline) {
                headers['Content-Disposition'] = `attachment; filename="${asset.fileName}"`;
            }

            return new NextResponse(fileBuffer, { headers });
        } catch (e) {
            console.error('File read error:', e);
            return NextResponse.json({ success: false, error: 'File not found on disk' }, { status: 404 });
        }

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
