import { Router } from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { 
  authRateLimiter, 
  registerRateLimiter, 
  passwordChangeRateLimiter 
} from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../validations/auth';

const router = Router();

// Public routes
router.post('/register', registerRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);

// Protected routes
router.use(authenticateToken);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/change-password', passwordChangeRateLimiter, validate(changePasswordSchema), changePassword);
router.delete('/deactivate', deactivateAccount);

export default router; 