import { prisma } from './prisma';
import { IGFormat, VisualStyle } from './templates';

export interface VisualPlan {
    id: string;
    format: IGFormat;
    title: string;
    style: VisualStyle;
    composition: string;
    design_notes: string;
    text_overlay: {
        headline: string;
        sub: string;
        cta: string;
    };
    image_prompt: string;
    backgroundUrl: string; // Curated from Unsplash for demo flow
    status: 'PENDING' | 'RENDERED';
    finalUrl?: string;
}

export interface AIOutput {
    internal_brief: {
        hook: string;
        key_message: string;
        cta: string;
    };
    primary_caption: string;
    hashtags: string[];
    image_ideas: VisualPlan[];
    // Keeping visualSystem for UI/rendering logic though not in the "strict JSON" snippet, 
    // it's needed for the engine.
    visualSystem?: {
        palette: { primary: string; secondary: string; accent: string };
        typography: { fontFamily: string; fontStyle: string };
        logoUsed: "url" | "monogram";
    };
}

export const generateAIContent = async (
    post: any,
    brandProfile: any
): Promise<AIOutput> => {
    const { industry, tone, language, doUseWords, dontUseWords } = brandProfile;
    const brandName = brandProfile.company?.name || "Brand";

    // Keyword logic
    const mandatoryKeywords = doUseWords?.split('\n').filter(Boolean) || [];
    const forbiddenWords = dontUseWords?.split('\n').filter(Boolean) || [];

    const hook = `Struggling with ${industry}? ${mandatoryKeywords[0] || 'Stop settling.'}`;
    const key_message = `Elevate your ${industry} with our premium approach.`;
    const cta = "Learn more at the link in bio!";

    const ideas: VisualPlan[] = [
        {
            id: 'idea_1',
            format: 'IG_POST',
            title: 'Main Hook Visual',
            style: 'LIFESTYLE',
            composition: 'High-end minimalist aesthetic with focal product in center.',
            design_notes: 'Use soft shadows and brand primary as accent.',
            text_overlay: {
                headline: hook,
                sub: 'Revolutionizing the industry.',
                cta: 'VIEW MORE'
            },
            image_prompt: `A hyper-realistic lifestyle shot of ${industry} context, soft high-key lighting, 8k resolution.`,
            backgroundUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1080',
            status: 'PENDING'
        },
        {
            id: 'idea_2',
            format: 'IG_CAROUSEL',
            title: 'Educational Slide',
            style: 'EDUCATIONAL',
            composition: 'Split layout with informative text on left and visual on right.',
            design_notes: 'Clear typography and high contrast.',
            text_overlay: {
                headline: '3 Ways to Scale.',
                sub: 'Master the fundamentals.',
                cta: 'SWIPE ->'
            },
            image_prompt: 'Clean workspace with organizational tools, top-down minimalist photography.',
            backgroundUrl: 'https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=1080',
            status: 'PENDING'
        },
        {
            id: 'idea_3',
            format: 'IG_STORY',
            title: 'Daily Update',
            style: 'PRODUCT',
            composition: 'Vertical center product shot with vertical text alignment.',
            design_notes: 'Optimized for mobile viewing, text in safe zones.',
            text_overlay: {
                headline: 'New Arrival',
                sub: 'Exclusively available now.',
                cta: 'SWIPE UP'
            },
            image_prompt: 'Product photography on reflective surface, dramatic studio lighting.',
            backgroundUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1080',
            status: 'PENDING'
        }
    ];

    return {
        internal_brief: { hook, key_message, cta },
        primary_caption: `🚀 ${brandName} | ${post.title}\n\n${hook}\n\n${key_message}\n\n${cta}\n\n#${industry?.replace(/\s+/g, '')} #Success`,
        hashtags: [industry?.replace(/\s+/g, '') || 'Business', 'Growth', 'Strategy'],
        image_ideas: ideas,
        visualSystem: {
            palette: {
                primary: brandProfile.primaryColor || "#4F46E5",
                secondary: brandProfile.secondaryColor || "#111827",
                accent: brandProfile.accentColor || "#F3F4F6"
            },
            typography: {
                fontFamily: brandProfile.fontFamily || "Inter",
                fontStyle: "Bold"
            },
            logoUsed: brandProfile.logoUrl ? "url" : "monogram"
        }
    };
};

export const saveAIOutput = async (postId: string, output: AIOutput) => {
    return prisma.postAIOutput.upsert({
        where: { postId },
        update: {
            internalBrief: JSON.stringify(output.internal_brief),
            primaryCaption: output.primary_caption,
            hashtags: JSON.stringify(output.hashtags),
            imageIdeas: JSON.stringify(output.image_ideas),
            visualSystem: output.visualSystem ? JSON.stringify(output.visualSystem) : null,
            version: { increment: 1 }
        },
        create: {
            postId,
            internalBrief: JSON.stringify(output.internal_brief),
            primaryCaption: output.primary_caption,
            hashtags: JSON.stringify(output.hashtags),
            imageIdeas: JSON.stringify(output.image_ideas),
            visualSystem: output.visualSystem ? JSON.stringify(output.visualSystem) : null,
        }
    });
};


export const getAIOutput = async (postId: string) => {
    const data = await prisma.postAIOutput.findUnique({
        where: { postId },
    });

    if (!data) return null;

    try {
        const internalBrief = JSON.parse(data.internalBrief);
        const imageIdeas = data.imageIdeas ? JSON.parse(data.imageIdeas) : [];
        const hashtags = data.hashtags ? JSON.parse(data.hashtags) : [];
        const visualSystem = data.visualSystem ? JSON.parse(data.visualSystem) : undefined;

        return {
            internal_brief: internalBrief,
            primary_caption: data.primaryCaption || '',
            hashtags: hashtags,
            image_ideas: imageIdeas,
            visualSystem: visualSystem
        };
    } catch (e) {
        console.error('Failed to parse AI output', e);
        return null;
    }
};
