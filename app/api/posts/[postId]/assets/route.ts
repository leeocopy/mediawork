import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { findPostById, addPostAsset, getPostAssets } from '@/lib/posts';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        const post = await findPostById(params.postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const assets = await getPostAssets(params.postId);

        return NextResponse.json({
            success: true,
            data: assets,
        });
    } catch (error) {
        console.error('Fetch assets error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const payload = verifyToken(token);

        const post = await findPostById(params.postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Validate File type
        const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'Invalid file type. Only PNG, JPEG, and PDF are allowed.' }, { status: 400 });
        }

        // 2. Limit File size (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ success: false, error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 3. Generate unique name using UUID to prevent path traversal and collisions
        const fileExtension = file.name.split('.').pop() || '';
        const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;

        // 4. Store in private folder (outside public)
        const uploadDir = join(process.cwd(), 'uploads');

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) { }

        const filePath = join(uploadDir, uniqueFileName);
        await writeFile(filePath, buffer);

        // Store relative path or just filename. Since we use a private endpoint, just store name.
        const fileUrl = `/api/posts/${params.postId}/assets/${uniqueFileName}/download`; // This is a placeholder for the download link logic

        // Get current version
        const existingAssets = await getPostAssets(params.postId);
        const version = existingAssets.length + 1;

        const asset = await addPostAsset({
            postId: params.postId,
            fileName: file.name, // Keep original filename in DB
            fileUrl: uniqueFileName, // Store the UUID filename in this field
            fileType: file.type,
            version,
        });

        // 5. Workflow integrity: Always set to PENDING_REVIEW on upload
        await prisma.post.update({
            where: { id: params.postId },
            data: { status: 'PENDING_REVIEW' },
        });

        return NextResponse.json({
            success: true,
            data: asset,
        });
    } catch (error: any) {
        console.error('Upload asset error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}
