import jwt from 'jsonwebtoken';
import { JWTPayload } from '../middleware/auth';

export interface TokenPayload {
  userId: number;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * Generate access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    if (!this.ACCESS_TOKEN_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    if (!this.REFRESH_TOKEN_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    if (!this.ACCESS_TOKEN_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload;
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    if (!this.REFRESH_TOKEN_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JWTPayload;
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
} 