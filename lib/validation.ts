import { z } from 'zod';

// Email validation
export const emailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long');

// Password validation
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)');

// Full name validation
export const fullNameSchema = z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes');

// Login schema
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

// Signup schema
export const signupSchema = z.object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
});

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
