import { prisma } from './prisma';

// Re-export types/enums for compatibility
export * from './types';

// Helper functions (now async using Prisma)

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
    });
};

export const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
    });
};

export const createUser = async (userData: {
    email: string;
    passwordHash: string;
    fullName: string;
}) => {
    return prisma.user.create({
        data: {
            email: userData.email,
            password: userData.passwordHash,
            fullName: userData.fullName,
        },
    });
};

export const getUserCompanies = async (userId: string) => {
    const memberships = await prisma.companyMember.findMany({
        where: { userId },
        include: {
            company: true,
        },
    });

    // Transform to match expected format (adding memberCount manually or efficiently)
    // For now, let's keep it simple. We might need memberCount.
    // Let's do a separate query or count if needed.

    // Efficiently get counts? GROUP BY companyId?
    // For now, lets just map the basic details. 

    // To get member counts for each company efficiently:
    const companyIds = memberships.map(m => m.companyId);

    const memberCounts = await prisma.companyMember.groupBy({
        by: ['companyId'],
        where: {
            companyId: { in: companyIds }
        },
        _count: {
            userId: true
        }
    });

    const countsMap = new Map(memberCounts.map(c => [c.companyId, c._count.userId]));

    return memberships.map(m => ({
        id: m.company.id,
        name: m.company.name,
        description: m.company.description,
        logo: m.company.logoUrl,
        coverImage: m.company.coverImage,
        createdAt: m.company.createdAt,
        updatedAt: m.company.updatedAt,
        memberCount: countsMap.get(m.companyId) || 0,
        userRole: m.role,
    }));
};

// Check if user is member of a company
export const isUserMemberOfCompany = async (userId: string, companyId: string): Promise<boolean> => {
    const count = await prisma.companyMember.count({
        where: {
            userId,
            companyId,
        },
    });
    return count > 0;
};

// Get member role
export const getMemberRole = async (userId: string, companyId: string): Promise<string | null> => {
    const membership = await prisma.companyMember.findUnique({
        where: {
            userId_companyId: { userId, companyId }
        }
    });
    return membership?.role || null;
};

// Find or create demo company (for fallback)
export const findOrCreateDemoCompany = async () => {
    let demoCompany = await prisma.company.findFirst({
        where: { name: 'Demo Company' }
    });

    if (!demoCompany) {
        demoCompany = await prisma.company.create({
            data: {
                name: 'Demo Company',
                description: 'A shared demo company for testing functionality',
            }
        });
    }

    return demoCompany;
};

// Add user to company (for demo join)
export const addUserToCompany = async (userId: string, companyId: string, role: string = 'member') => {
    // Upsert or create
    return prisma.companyMember.create({
        data: {
            userId,
            companyId,
            role,
        },
    }).catch(e => {
        // If unique constraint violation (already member), just return existing
        if (e.code === 'P2002') {
            return prisma.companyMember.findUniqueOrThrow({
                where: {
                    userId_companyId: { userId, companyId }
                }
            });
        }
        throw e;
    });
};
