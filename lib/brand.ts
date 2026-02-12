import { prisma } from './prisma';

export interface BrandProfileData {
    industry: string;
    targetAudience: string;
    tone: string;
    language: string;
    products: string;
    uvp: string;
    primaryColor?: string;
    secondaryColor?: string | null;
    accentColor?: string | null;
    fontFamily?: string;
    fontStyle?: string | null;
    logoUrl?: string | null;
    companyDescription?: string | null;
    tagline?: string | null;
    websiteUrl?: string | null;
    socialInstagram?: string | null;
    socialFacebook?: string | null;
    socialLinkedin?: string | null;
    socialTiktok?: string | null;
    doUseWords?: string | null;
    dontUseWords?: string | null;
    emojiUsage?: string;
}

export const getBrandProfile = async (companyId: string) => {
    return prisma.brandProfile.findUnique({
        where: { companyId },
        include: { company: true },
    });
};

export const updateBrandProfile = async (companyId: string, data: any) => {
    // Sanitizing data to only include schema fields
    const { id, companyId: cid, createdAt, updatedAt, ...rest } = data;

    return prisma.brandProfile.upsert({
        where: { companyId },
        update: rest,
        create: {
            ...rest,
            companyId,
        },
    });
};
