export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { findPostById } from '@/lib/posts';
import { getBrandProfile } from '@/lib/brand';
import { prisma } from '@/lib/prisma';
import { generateAIContent, saveAIOutput } from '@/lib/ai';

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
        const postId = params.postId;

        // 1. Get Post
        const post = await findPostById(postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        // 2. Verify Member
        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        // 3. Get Brand Profile
        // 3. Get Brand Profile
        let brandProfile = await getBrandProfile(post.companyId);

        if (!brandProfile) {
            // Auto-create a default brand profile to unblock the user
            console.log('Brand Profile missing, creating default...');
            brandProfile = await prisma.brandProfile.create({
                data: {
                    companyId: post.companyId,
                    industry: 'General Business',
                    targetAudience: 'Everyone',
                    tone: 'Professional',
                    language: 'English',
                    products: 'Our Services',
                    uvp: 'High Quality',
                    primaryColor: '#000000',
                    fontFamily: 'Inter',
                    emojiUsage: 'light'
                },
                include: { company: true }
            });
        }

        // 4. Generate Content
        const aiContent = await generateAIContent(post, brandProfile);

        // 5. Save/Update Output
        const savedOutput = await saveAIOutput(postId, aiContent);

        return NextResponse.json({
            success: true,
            data: {
                ...aiContent,
                id: savedOutput.id,
                version: savedOutput.version
            }
        });
    } catch (error) {
        console.error('Generation error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
