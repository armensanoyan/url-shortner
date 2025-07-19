import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log({authHeader});
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token is required' 
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ 
        success: false, 
        message: 'JWT secret is not configured' 
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Fetch user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    // console.log({user});
    if (!user || !user.isActive) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive user' 
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    } else {
      console.error('Auth middleware error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we just continue without setting req.user
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }

    // For now, we'll implement a simple role check
    // You can extend the User model to include roles if needed
    if (roles.length > 0 && !roles.includes('user')) {
      res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
      return;
    }

    next();
  };
}; 