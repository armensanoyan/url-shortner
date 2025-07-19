import { Op } from 'sequelize';
import Url from '../models/Url';

/**
 * Generate a random slug of specified length
 */
export function generateRandomSlug(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if a slug already exists in the database
 */
export async function isSlugExists(slug: string): Promise<boolean> {
    const existingUrl = await Url.findOne({
      where: {
        slug: slug,
        isActive: true,
      },
    });
    return !!existingUrl;
}

/**
 * Generate a unique slug
 * If a custom slug is provided, check if it's available
 * If not provided or not available, generate a random one
 */
export async function generateUniqueSlug(customSlug?: string, maxRetries: number = 10): Promise<string> {
  // If custom slug is provided, check if it's available
  
  if (customSlug) {
    const normalizedSlug = customSlug.toLowerCase().trim();
    const exists = await isSlugExists(normalizedSlug);
    if (!exists) {
      return normalizedSlug;
    }
    throw new Error('Custom slug is already taken');
  }

  // Generate random slug with retry logic
  for (let i = 0; i < maxRetries; i++) {
    const randomSlug = generateRandomSlug(6 + i); // Increase length on each retry
    const exists = await isSlugExists(randomSlug);
    if (!exists) {
      return randomSlug;
    }
  }

  throw new Error('Unable to generate unique slug after maximum retries');
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-zA-Z0-9_-]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Sanitize slug (remove invalid characters, convert to lowercase)
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '') // Remove invalid characters
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single
    .replace(/^[_-]+|[_-]+$/g, ''); // Remove leading/trailing underscores and hyphens
} 