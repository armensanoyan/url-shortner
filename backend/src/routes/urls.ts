import { Router } from 'express';
import {
  createUrl,
  getUrls,
  getUrlById,
  updateUrl,
  deleteUrl,
  getUrlAnalytics,
  getDashboardStats,
} from '../controllers/urlController';
import { authenticateToken } from '../middleware/auth';
import { urlRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  createUrlSchema,
  updateUrlSchema,
  getUrlsQuerySchema,
} from '../validations/url';

const router = Router();

// Public routes (no authentication required)
// Note: redirectToUrl is handled in the main index.ts file

// Protected routes (authentication required)
router.use(authenticateToken);

// URL management routes
router.post('/', urlRateLimiter, validate(createUrlSchema), createUrl);
router.get('/', validate(getUrlsQuerySchema), getUrls);
router.get('/dashboard/stats', getDashboardStats);
router.get('/:id', getUrlById);
router.put('/:id', urlRateLimiter, validate(updateUrlSchema), updateUrl);
router.delete('/:id', deleteUrl);
router.get('/:id/analytics', getUrlAnalytics);

export default router; 