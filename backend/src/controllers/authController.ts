import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput
} from '../validations/auth';

// Request types are now imported from validations/auth.ts

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName }: RegisterInput = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      isActive: true
    });

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // TODO: check secret exists on start
      res.status(500).json({
        success: false,
        message: 'JWT secret is not configured'
      });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    // Update last login
    await user.updateLastLogin();

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
      return;
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        success: false,
        message: 'JWT secret is not configured'
      });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    // Update last login
    await user.updateLastLogin();

    // Return user data without password
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token. However, you could implement a blacklist
    // or use refresh tokens for more security.
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {

    const userResponse = {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      isActive: req.user.isActive,
      lastLoginAt: req.user.lastLoginAt,
      createdAt: req.user.createdAt
    };

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {

    const { firstName, lastName }: UpdateProfileInput = req.body;

    // Update user profile
    await req.user.update({
      firstName,
      lastName
    });

    const userResponse = {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      isActive: req.user.isActive,
      lastLoginAt: req.user.lastLoginAt,
      createdAt: req.user.createdAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {

    const { currentPassword, newPassword }: ChangePasswordInput = req.body;
    
    // Fetch user with password field for comparison
    const userWithPassword = await User.findByPk(req.user.id);
    if (!userWithPassword) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isValidPassword = await userWithPassword.comparePassword(currentPassword);
    console.log({currentPassword, newPassword, isValidPassword});
    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Update password
    await userWithPassword.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deactivateAccount = async (req: Request, res: Response): Promise<void> => {
  try {

    // Deactivate user account
    await req.user.update({ isActive: false });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 