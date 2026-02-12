import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { findPostById } from '@/lib/posts';
import { getAIOutput } from '@/lib/ai';
import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';

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
        const postId = params.postId;

        const post = await findPostById(postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const aiOutput = await getAIOutput(postId);
        if (!aiOutput) {
            return NextResponse.json({ success: false, error: 'AI Content not found' }, { status: 400 });
        }

        const zip = new JSZip();

        // 1. Add Captions & Hashtags
        zip.file('caption.txt', aiOutput.primary_caption);
        zip.file('hashtags.txt', aiOutput.hashtags.join(', '));

        // 2. Add Brief
        const briefContent = `HOOK: ${aiOutput.internal_brief.hook}\nKEY MESSAGE: ${aiOutput.internal_brief.key_message}\nCTA: ${aiOutput.internal_brief.cta}`;
        zip.file('brief.txt', briefContent);

        // 3. Add Scheduling JSON
        const schedule = {
            postId,
            scheduledAt: post.scheduledAt || null,
            platform: post.platform,
            postType: post.postType,
            title: post.title
        };
        zip.file('schedule.json', JSON.stringify(schedule, null, 2));

        // 4. Add Visuals
        const visualsFolder = zip.folder('visuals');
        if (visualsFolder) {
            // Find rendered images on filesystem
            const generatedDir = path.join(process.cwd(), 'public', 'generated', postId);

            try {
                const files = await fs.readdir(generatedDir);
                for (const file of files) {
                    if (file.endsWith('.png') || file.endsWith('.jpg')) {
                        const fileData = await fs.readFile(path.join(generatedDir, file));
                        visualsFolder.file(file, fileData);
                    }
                }
            } catch (e) {
                console.warn('No generated images found on disk for export');
            }
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        return new Response(new Uint8Array(zipBuffer), {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="post_export_${postId}.zip"`,
            },
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
    }
}
