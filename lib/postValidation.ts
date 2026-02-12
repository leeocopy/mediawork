import { z } from 'zod';

// Step 2: Post validation schemas
export const createPostSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    platform: z.enum(['Instagram', 'Facebook', 'LinkedIn'], {
        errorMap: () => ({ message: 'Platform must be Instagram, Facebook, or LinkedIn' }),
    }),
    postType: z.enum(['Promo', 'Educational', 'Announcement', 'Testimonial'], {
        errorMap: () => ({ message: 'Post type must be Promo, Educational, Announcement, or Testimonial' }),
    }),
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
    notes: z.string().max(1000, 'Notes are too long').optional(),
    status: z.enum(['PLANNED', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED']).optional().default('PLANNED'),
});

export const updatePostSchema = createPostSchema.partial();

// Helper to format validation errors
export const formatZodErrors = (errors: z.ZodError) => {
    const formatted: Record<string, string> = {};
    errors.errors.forEach((err) => {
        if (err.path[0]) {
            formatted[err.path[0].toString()] = err.message;
        }
    });
    return formatted;
};
