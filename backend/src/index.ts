import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import User from './models/User';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database models
    // TODO: Remove alter: true in production
    // await sequelize.sync({ alter: true });
    // console.log('Database models synchronized.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

await startServer()

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'URL Shortener API is running!' });
});

// Health check routes
app.use('/health', healthRouter);

// Authentication routes
app.use('/auth', authRouter);