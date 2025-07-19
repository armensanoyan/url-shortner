# Database Migrations

This document explains how to set up and manage the database for the URL Shortener application using Docker Compose with SQL-based migrations.

## Prerequisites

1. Docker and Docker Compose installed
2. Environment variables configured (see `env.example`)

## Database Setup with Docker

### 1. Start all services (recommended)

```bash
docker-compose up
```

This will automatically:
- Start PostgreSQL database
- Run all SQL migrations
- Start the backend application
- Start the frontend application

### 2. Start only database and migrations

```bash
# Start PostgreSQL and run migrations
docker-compose up postgres migrate

# Start backend after migrations complete
docker-compose up backend
```

## Migration System

The project uses SQL-based migrations located in `init/migrations/`:

### Current Migrations

- `001-init.sql` - Creates the initial database schema:
  - `users` table - User accounts and authentication
  - `urls` table - Shortened URLs with metadata

### Migration Process

1. **Database Creation**: The migrate service creates the database if it doesn't exist
2. **Migration Execution**: All SQL files in `init/migrations/` are executed in order
3. **Idempotency**: Migrations use `IF NOT EXISTS` to be safely re-runnable

## Database Schema

### users Table
- `id` - Primary key (SERIAL)
- `username` - User's username (TEXT, NOT NULL)
- `email` - User's email address (TEXT, NOT NULL)
- `password` - Hashed password (TEXT, NOT NULL)
- `created_at` - Timestamp when user was created (TIMESTAMP, DEFAULT NOW())

### urls Table
- `id` - Primary key (SERIAL)
- `originalUrl` - The original long URL (TEXT, NOT NULL)
- `short_url` - The shortened URL code (TEXT, NOT NULL)
- `created_at` - Timestamp when URL was created (TIMESTAMP, DEFAULT NOW())

## Adding New Migrations

### 1. Create a new migration file

```bash
# Create a new migration file with sequential numbering
touch init/migrations/002-add-clicks-table.sql
```

### 2. Add your SQL schema changes

```sql
-- Example: 002-add-clicks-table.sql
-- Add clicks table for analytics
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  url_id INTEGER REFERENCES urls(id),
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  country CHAR(2),
  city TEXT,
  clicked_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
```

### 3. Run the migration

```bash
# Restart services to run new migrations
docker-compose down
docker-compose up
```

## Manual Database Operations

### Using Docker Compose

```bash
# Run migrations only
docker-compose run --rm migrate

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d test

# View migration logs
docker-compose logs migrate

# Reset database (WARNING: This will delete all data)
docker-compose down -v
docker-compose up
```

### Using Local PostgreSQL (if installed)

```bash
# Connect to database
psql -h localhost -p 5431 -U postgres -d test

# List all tables
\dt

# View table structure
\d users
\d urls
```

## Environment Variables

Make sure your environment variables are configured correctly:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=test

# Application Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Docker Setup Details

The application includes automatic database initialization when running in Docker:

1. **Database Creation**: The migrate service automatically creates the database if it doesn't exist
2. **Migration Running**: All SQL migrations are automatically applied on startup
3. **Health Checks**: Services wait for dependencies to be ready before starting

### Service Dependencies

```
postgres (healthy) → migrate (completed) → backend (started) → frontend (started)
```

### Running with Docker Compose

```bash
# Start all services
docker-compose up

# Start only backend and database
docker-compose up postgres migrate backend

# Rebuild and start
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f migrate
docker-compose logs -f backend
```

## Troubleshooting

### Common Issues

1. **Migration fails with "database does not exist"**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # View PostgreSQL logs
   docker-compose logs postgres
   ```

2. **Permission denied errors**
   - Ensure environment variables match PostgreSQL configuration
   - Check that `DB_USER` and `DB_PASSWORD` are correct

3. **Migration files not found**
   ```bash
   # Verify migration files exist
   ls -la init/migrations/
   
   # Check file permissions
   ls -la init/run-migrations.sh
   ```

4. **Connection refused errors**
   ```bash
   # Test database connection
   docker-compose exec postgres pg_isready -U postgres
   
   # Check if database exists
   docker-compose exec postgres psql -U postgres -l
   ```

### Debugging Commands

```bash
# Check service status
docker-compose ps

# View all logs
docker-compose logs

# View specific service logs
docker-compose logs -f migrate
docker-compose logs -f backend

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d test

# List all tables
docker-compose exec postgres psql -U postgres -d test -c "\dt"

# Check table structure
docker-compose exec postgres psql -U postgres -d test -c "\d users"
docker-compose exec postgres psql -U postgres -d test -c "\d urls"
```

### Reset Database

If you need to completely reset the database:

```bash
# Stop all services and remove volumes
docker-compose down -v

# Start fresh
docker-compose up
```

## Production Considerations

For production deployments:

1. **Backup Strategy**: Implement regular database backups
2. **Migration Testing**: Test migrations on staging environment first
3. **Rollback Plan**: Have a plan to rollback schema changes if needed
4. **Monitoring**: Monitor database performance and connection health
5. **Security**: Use strong passwords and restrict database access
6. **Environment Variables**: Use proper secrets management for production credentials 