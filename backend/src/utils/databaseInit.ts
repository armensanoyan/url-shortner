import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'url_shortener'
});

const createDatabaseIfNotExists = async (): Promise<void> => {
  const config = getDatabaseConfig();
  
  // Connect to default postgres database to create our target database
  const adminSequelize = new Sequelize({
    dialect: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: 'postgres', // Connect to default database
    logging: false,
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    await adminSequelize.authenticate();
    console.log('Connected to PostgreSQL server');

    // Check if our target database exists
    const results = await adminSequelize.query(
      "SELECT 1 FROM pg_database WHERE datname = :database",
      {
        replacements: { database: config.database },
        type: 'SELECT'
      }
    );

    // Debug: Log the results structure
    console.log('Database check results:', JSON.stringify(results, null, 2));

    // The result is an array where the first element contains the rows
    const rows = results[0] as any[];
    
    if (!rows || rows.length === 0) {
      console.log(`Database '${config.database}' does not exist. Creating...`);
      await adminSequelize.query(`CREATE DATABASE "${config.database}"`);
      console.log(`Database '${config.database}' created successfully`);
    } else {
      console.log(`Database '${config.database}' already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await adminSequelize.close();
  }
};

const waitForPostgreSQL = async (maxRetries: number = 30, delay: number = 1000): Promise<void> => {
  const config = getDatabaseConfig();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Connect to default postgres database to check if PostgreSQL server is ready
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: 'postgres', // Connect to default database
        logging: false,
        pool: {
          max: 1,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });

      await sequelize.authenticate();
      await sequelize.close();
      console.log('PostgreSQL server is ready');
      return;
    } catch (error) {
      console.log(`PostgreSQL not ready (attempt ${i + 1}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`PostgreSQL connection failed after ${maxRetries} attempts`);
};

const runMigrations = async (): Promise<void> => {
  try {
    console.log('Running database migrations...');
    
    // Import and run migrations manually since we're in a TypeScript environment
    execSync('npx sequelize-cli db:migrate', {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

export const initializeDatabase = async (): Promise<void> => {
  console.log('Starting database initialization...');
  
  try {
    // Wait for PostgreSQL server to be available
    await waitForPostgreSQL();
    
    // Create database if it doesn't exist
    await createDatabaseIfNotExists();
    
    // Run migrations
    await runMigrations();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}; 