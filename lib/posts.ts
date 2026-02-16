import { prisma } from './prisma';

// Define types that match Prisma generated types or are compatible
export type Post = {
    id: string;
    companyId: string;
    date: string;
    platform: string;
    postType: string;
    title: string;
    notes: string | null;
    status: string;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    publishedUrl: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
};

// Get posts for a company within date range
export const getCompanyPosts = async (
    companyId: string,
    startDate: string,
    endDate: string,
    filters?: { platform?: string; status?: string }
): Promise<Post[]> => {
    const where: any = {
        companyId,
        date: {
            gte: startDate,
            lte: endDate,
        },
    };

    if (filters?.platform) {
        where.platform = filters.platform;
    }

    if (filters?.status) {
        where.status = filters.status;
    }

    const posts = await prisma.post.findMany({
        where,
        orderBy: {
            date: 'asc',
        },
    });

    return posts;
};

// Create a new post
export const createPost = async (postData: {
    companyId: string;
    date: string;
    platform: string;
    postType: string;
    title: string;
    notes?: string;
    status: string;
    createdBy: string;
}): Promise<Post> => {
    return prisma.post.create({
        data: {
            ...postData,
            notes: postData.notes || null, // Handle optional field
        },
    });
};

// Find post by ID
export const findPostById = async (postId: string): Promise<Post | null> => {
    return prisma.post.findUnique({
        where: { id: postId },
    });
};

// Update post
export const updatePost = async (postId: string, updates: Partial<Post>): Promise<Post | null> => {
    try {
        // Remove fields that shouldn't be updated directly or don't exist in Prisma update input
        const cleanUpdates = { ...updates };
        delete (cleanUpdates as any).id;
        delete (cleanUpdates as any).createdAt;
        delete (cleanUpdates as any).updatedAt;

        return await prisma.post.update({
            where: { id: postId },
            data: cleanUpdates,
        });
    } catch (error) {
        return null; // Return null if not found
    }
};

// Delete post
export const deletePost = async (postId: string): Promise<boolean> => {
    try {
        await prisma.post.delete({
            where: { id: postId },
        });
        return true;
    } catch (error) {
        return false;
    }
};
// Add asset to post
export const addPostAsset = async (assetData: {
    postId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    version?: number;
}) => {
    return (prisma as any).postAsset.create({
        data: assetData,
    });
};

// Get assets for post
export const getPostAssets = async (postId: string) => {
    return (prisma as any).postAsset.findMany({
        where: { postId },
        orderBy: { uploadedAt: 'desc' },
    });
};

// Add activity log
export const addPostActivity = async (activity: {
    postId: string;
    userId: string;
    action: string;
    details?: string;
}) => {
    return (prisma as any).postActivity.create({
        data: activity,
    });
};

// Add post review
export const addPostReview = async (reviewData: {
    postId: string;
    status: string;
    reviewerId: string;
    comment?: string;
}) => {
    // Note: Removed transaction for HTTP adapter compatibility on Vercel
    const review = await (prisma as any).postReview.create({
        data: reviewData,
    });

    await (prisma as any).post.update({
        where: { id: reviewData.postId },
        data: { status: reviewData.status },
    });

    // Log activity
    await (prisma as any).postActivity.create({
        data: {
            postId: reviewData.postId,
            userId: reviewData.reviewerId,
            action: 'REVIEWED',
            details: `Status set to ${reviewData.status}${reviewData.comment ? `: ${reviewData.comment}` : ''}`,
        }
    });

    return review;
};

// Get latest post review
export const getLatestPostReview = async (postId: string) => {
    return (prisma as any).postReview.findFirst({
        where: { postId },
        orderBy: { createdAt: 'desc' },
    });
};
// Find asset by ID
export const findAssetById = async (assetId: string) => {
    return (prisma as any).postAsset.findUnique({
        where: { id: assetId },
    });
};
