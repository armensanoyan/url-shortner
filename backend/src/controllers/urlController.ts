import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Url from '../models/Url';
import User from '../models/User';
import { generateUniqueSlug, sanitizeSlug } from '../utils/slug';
import { CreateUrlInput, UpdateUrlInput, GetUrlsQueryInput } from '../validations/url';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

/**
 * Create a new shortened URL
 * POST /api/urls
 */
export const createUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { originalUrl, title, description, slug, expiresAt } = req.body as CreateUrlInput;
    const userId = req.user?.id;
    // Generate unique slug
    let finalSlug: string;
    try {
      finalSlug = await generateUniqueSlug(slug);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate unique slug',
      });
    }

    // Create the URL
    const url = await Url.create({
      slug: finalSlug,
      originalUrl,
      title,
      description,
      userId,
      expiresAt,
    });

    // Build the shortened URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const shortenedUrl = `${baseUrl}/${finalSlug}`;

    res.status(201).json({
      success: true,
      data: {
        id: url.id,
        slug: url.slug,
        originalUrl: url.originalUrl,
        title: url.title,
        description: url.description,
        shortenedUrl,
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all URLs (with pagination, search, and sorting)
 * GET /api/urls
 */
export const getUrls = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.query as any;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const search = query.search;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const userId = req.user?.id;

    // Build where clause
    const whereClause: any = {
      isActive: true,
    };

    // If user is authenticated, only show their URLs
    if (userId) {
      whereClause.userId = userId;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { slug: { [Op.iLike]: `%${search}%` } },
        { originalUrl: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get URLs with pagination
    const { count, rows: urls } = await Url.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    // Build shortened URLs
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const urlsWithShortenedUrl = urls.map((url) => ({
      ...url.toJSON(),
      shortenedUrl: `${baseUrl}/${url.slug}`,
    }));

    res.json({
      success: true,
      data: {
        urls: urlsWithShortenedUrl,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page * limit < count,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error getting URLs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get a specific URL by ID
 * GET /api/urls/:id
 */
export const getUrlById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const whereClause: any = {
      id: parseInt(id),
      isActive: true,
    };

    // If user is authenticated, only allow access to their own URLs
    if (userId) {
      whereClause.userId = userId;
    }

    const url = await Url.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    // Build shortened URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const shortenedUrl = `${baseUrl}/${url.slug}`;

    res.json({
      success: true,
      data: {
        ...url.toJSON(),
        shortenedUrl,
      },
    });
  } catch (error) {
    console.error('Error getting URL by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update a URL
 * PUT /api/urls/:id
 */
export const updateUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateUrlInput;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Find the URL and ensure it belongs to the user
    const url = await Url.findOne({
      where: {
        id: parseInt(id),
        userId,
        isActive: true,
      },
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    // If slug is being updated, check if it's unique
    if (updateData.slug && updateData.slug !== url.slug) {
      const sanitizedSlug = sanitizeSlug(updateData.slug);
      const existingUrl = await Url.findOne({
        where: {
          slug: sanitizedSlug,
          id: { [Op.ne]: parseInt(id) },
          isActive: true,
        },
      });

      if (existingUrl) {
        return res.status(400).json({
          success: false,
          message: 'Slug is already taken',
        });
      }

      updateData.slug = sanitizedSlug;
    }

    // Update the URL
    await url.update(updateData);

    // Build shortened URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const shortenedUrl = `${baseUrl}/${url.slug}`;

    res.json({
      success: true,
      data: {
        ...url.toJSON(),
        shortenedUrl,
      },
    });
  } catch (error) {
    console.error('Error updating URL:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete a URL (soft delete)
 * DELETE /api/urls/:id
 */
export const deleteUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Find the URL and ensure it belongs to the user
    const url = await Url.findOne({
      where: {
        id: parseInt(id),
        userId,
        isActive: true,
      },
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    // Soft delete by setting isActive to false
    await url.update({ isActive: false });

    res.json({
      success: true,
      message: 'URL deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Redirect to original URL
 * GET /:slug
 */
export const redirectToUrl = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const url = await Url.findOne({
      where: {
        slug: slug,
        isActive: true,
      },
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    // Check if URL is expired
    if (url.isExpired()) {
      return res.status(410).json({
        success: false,
        message: 'URL has expired',
      });
    }

    // Increment visit count
    await url.incrementVisitCount();

    // Redirect to original URL
    res.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error redirecting URL:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get URL analytics (visit count, etc.)
 * GET /api/urls/:id/analytics
 */
export const getUrlAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const url = await Url.findOne({
      where: {
        id: parseInt(id),
        userId,
        isActive: true,
      },
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: url.id,
        slug: url.slug,
        visitCount: url.visitCount,
        lastVisitedAt: url.lastVisitedAt,
        createdAt: url.createdAt,
        updatedAt: url.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting URL analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/urls/dashboard/stats
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get total URLs
    const totalUrls = await Url.count({
      where: {
        userId,
        isActive: true,
      },
    });

    // Get total visits
    const totalVisits = await Url.sum('visitCount', {
      where: {
        userId,
        isActive: true,
      },
    });

    // Get most popular URLs (top 5)
    const popularUrls = await Url.findAll({
      where: {
        userId,
        isActive: true,
      },
      order: [['visitCount', 'DESC']],
      limit: 5,
      attributes: ['id', 'slug', 'title', 'visitCount', 'lastVisitedAt'],
    });

    // Get recent URLs (last 5)
    const recentUrls = await Url.findAll({
      where: {
        userId,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'slug', 'title', 'visitCount', 'createdAt'],
    });

    res.json({
      success: true,
      data: {
        totalUrls,
        totalVisits: totalVisits || 0,
        popularUrls,
        recentUrls,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}; 

export const redirectToUrlPublic = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    console.log({slug});
    // Skip if this is an API route
    if (slug.startsWith('api') || slug.startsWith('auth') || slug.startsWith('health')) {
      return res.status(404).json({
        success: false,
        message: 'Not found',
      });
    }

    const url = await Url.findOne({
      where: {
        slug: slug,
        isActive: true,
      },
    });
    console.log({url});
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found',
      });
    }

    // Check if URL is expired
    if (url.isExpired()) {
      return res.status(410).json({
        success: false,
        message: 'URL has expired',
      });
    }

    // Increment visit count
    await url.incrementVisitCount();

    // Redirect to original URL
    res.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error redirecting URL:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}