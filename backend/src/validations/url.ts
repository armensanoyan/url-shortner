import { z } from 'zod';

// Base URL schema
const urlBaseSchema = z.object({
  originalUrl: z
    .string()
    .url('Please provide a valid URL')
    .min(1, 'URL is required')
    .max(2048, 'URL must be less than 2048 characters')
    .transform((url) => {
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }),
  title: z
    .string()
    .min(1, 'Title must be at least 1 character')
    .max(255, 'Title must be less than 255 characters')
    .optional()
    .transform((val) => val?.trim()),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform((val) => val?.trim()),
  expiresAt: z
    .string()
    .datetime('Please provide a valid date')
    .optional()
    .transform((val) => val ? new Date(val) : undefined),
});

// Create URL schema (with optional custom slug)
export const createUrlSchema = urlBaseSchema.extend({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, underscores, and hyphens')
    .optional()
    .transform((val) => val?.toLowerCase().trim()),
});

// Update URL schema
export const updateUrlSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Slug can only contain letters, numbers, underscores, and hyphens')
    .optional()
    .transform((val) => val?.toLowerCase().trim()),
  originalUrl: z
    .string()
    .url('Please provide a valid URL')
    .min(1, 'URL is required')
    .max(2048, 'URL must be less than 2048 characters')
    .optional()
    .transform((url) => {
      if (!url) return url;
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }),
  title: z
    .string()
    .min(1, 'Title must be at least 1 character')
    .max(255, 'Title must be less than 255 characters')
    .optional()
    .transform((val) => val?.trim()),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform((val) => val?.trim()),
  isActive: z
    .boolean()
    .optional(),
  expiresAt: z
    .string()
    .datetime('Please provide a valid date')
    .optional()
    .transform((val) => val ? new Date(val) : undefined),
}).refine((data) => {
  // At least one field must be provided for update
  return data.slug || data.originalUrl || data.title !== undefined || 
         data.description !== undefined || data.isActive !== undefined || 
         data.expiresAt !== undefined;
}, {
  message: 'At least one field must be provided for update',
});

// Get URLs query schema
export const getUrlsQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'Page must be at least 1'))
    .optional()
    .default(() => 1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100'))
    .optional()
    .default(() => 10),
  search: z
    .string()
    .min(1, 'Search term must be at least 1 character')
    .max(100, 'Search term must be less than 100 characters')
    .optional()
    .transform((val) => val?.trim()),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'visitCount', 'lastVisitedAt', 'title'])
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// Slug parameter schema
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid slug format'),
});

// Type exports for TypeScript
export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type UpdateUrlInput = z.infer<typeof updateUrlSchema>;
export type GetUrlsQueryInput = z.infer<typeof getUrlsQuerySchema>;
export type SlugParamInput = z.infer<typeof slugParamSchema>; 