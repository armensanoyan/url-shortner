import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';

const router: Router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 