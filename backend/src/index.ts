import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import { initializeDatabase } from './utils/databaseInit';
import healthRouter from './routes/health';

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
    // Initialize database (create if not exists, run migrations)
    await initializeDatabase();
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
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