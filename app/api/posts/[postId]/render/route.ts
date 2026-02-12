export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { isUserMemberOfCompany } from '@/lib/db';
import { findPostById } from '@/lib/posts';
import { getBrandProfile } from '@/lib/brand';
import { getAIOutput, saveAIOutput } from '@/lib/ai';
import { renderFinalVisual } from '@/lib/image-processor';
import { prisma } from '@/lib/prisma';
import { FORMAT_CONFIGS } from '@/lib/templates';

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

        const post = await findPostById(postId);
        if (!post) {
            return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }

        const isMember = await isUserMemberOfCompany(payload.userId, post.companyId);
        if (!isMember) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const brandProfile = await getBrandProfile(post.companyId);
        if (!brandProfile) {
            return NextResponse.json({ success: false, error: 'Brand kit required' }, { status: 400 });
        }

        const aiOutput = await getAIOutput(postId);
        if (!aiOutput || !aiOutput.image_ideas) {
            return NextResponse.json({ success: false, error: 'AI Plan not found' }, { status: 400 });
        }

        const brandInitial = brandProfile.company?.name?.charAt(0).toUpperCase() || "B";

        // Render all ideas
        const updatedIdeas = [...aiOutput.image_ideas];
        const assetsToCreate = [];

        for (let i = 0; i < updatedIdeas.length; i++) {
            const plan = updatedIdeas[i];
            const format = plan.format as any; // Casting to avoid indexing error
            const formatCfg = (FORMAT_CONFIGS as any)[format] || FORMAT_CONFIGS.IG_POST;

            const finalUrl = await renderFinalVisual({
                postId,
                ideaId: plan.id,
                format: format,
                style: plan.style,
                backgroundUrl: plan.backgroundUrl,
                logoUrl: brandProfile.logoUrl || undefined,
                overlayText: plan.text_overlay.headline,
                subtitleText: plan.text_overlay.sub,
                ctaText: plan.text_overlay.cta,
                brandColors: {
                    primary: brandProfile.primaryColor || "#4F46E5",
                    secondary: brandProfile.secondaryColor || "#111827",
                    accent: brandProfile.accentColor || "#F3F4F6"
                },
                fontFamily: brandProfile.fontFamily || 'Inter',
                brandInitial
            });

            plan.finalUrl = finalUrl;
            plan.status = 'RENDERED';

            assetsToCreate.push({
                postId,
                fileName: `visual_${plan.id}.png`,
                fileUrl: finalUrl,
                fileType: 'image/png',
                version: 1,
            });
        }

        // Save assets to DB
        await prisma.postAsset.createMany({
            data: assetsToCreate
        });

        aiOutput.image_ideas = updatedIdeas;
        await saveAIOutput(postId, aiOutput);

        return NextResponse.json({
            success: true,
            data: {
                ideas: updatedIdeas,
                assets: assetsToCreate
            }
        });

    } catch (error) {
        console.error('Rendering endpoint error:', error);
        return NextResponse.json({ success: false, error: 'Rendering failed' }, { status: 500 });
    }
}
