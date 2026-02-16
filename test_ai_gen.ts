
import { prisma } from './lib/prisma';
import { generateAIContent, saveAIOutput } from './lib/ai';

async function test() {
    console.log("Finding a post...");
    const post = await prisma.post.findFirst({
        include: { company: true }
    });

    if (!post) {
        console.log("No post found.");
        return;
    }

    console.log("Found post:", post.id, "title:", post.title);

    console.log("Finding brand profile...");
    let brandProfile = await prisma.brandProfile.findUnique({
        where: { companyId: post.companyId },
        include: { company: true }
    });

    if (!brandProfile) {
        console.log("No brand profile found, using fallback logic from route...");
        // This is what the route does
        brandProfile = {
            companyId: post.companyId,
            industry: 'General Business',
            targetAudience: 'Everyone',
            tone: 'Professional',
            language: 'English',
            products: 'Our Services',
            uvp: 'High Quality',
            primaryColor: '#000000',
            fontFamily: 'Inter',
            emojiUsage: 'light',
            company: post.company
        } as any;
    }

    try {
        console.log("Generating AI content...");
        const aiContent = await generateAIContent(post, brandProfile);
        console.log("AI Content generated successfully.");

        console.log("Saving AI output...");
        const saved = await saveAIOutput(post.id, aiContent);
        console.log("AI Output saved successfully version:", saved.version);
    } catch (e: any) {
        console.error("FAILED:", e.message);
        console.error("Stack:", e.stack);
    }
}

test();
