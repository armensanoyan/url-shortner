import { z } from 'zod';

// Base user schema
const userBaseSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// Registration schema
export const registerSchema = userBaseSchema.extend({
  firstName: z
    .string()
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name must be less than 50 characters')
    .optional()
    .transform((val) => val?.trim()),
  lastName: z
    .string()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must be less than 50 characters')
    .optional()
    .transform((val) => val?.trim()),
});

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .min(1, 'Email is required')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Profile update schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name must be less than 50 characters')
    .optional()
    .transform((val) => val?.trim()),
  lastName: z
    .string()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must be less than 50 characters')
    .optional()
    .transform((val) => val?.trim()),
}).refine((data) => data.firstName || data.lastName, {
  message: 'At least one of first name or last name is required',
  path: ['firstName', 'lastName'],
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters long')
    .max(100, 'New password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

