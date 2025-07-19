# Database Setup with Docker Compose

This project uses a dedicated `migrate` service to handle all database initialization tasks before the backend application starts.

## Architecture

The setup consists of four main services:

1. **postgres** - PostgreSQL database server
2. **migrate** - Database migration service (runs once)
3. **backend** - Main backend application
4. **frontend** - Frontend application

## Service Dependencies

```
postgres (healthy) → migrate (completed) → backend (started) → frontend (started)
```

## What the migrate service does

The `migrate` service performs the following tasks in order:

1. **Wait for PostgreSQL** - Ensures the PostgreSQL server is ready and accepting connections
2. **Create Database** - Creates the target database if it doesn't exist
3. **Run Migrations** - Executes all SQL migration files in order to create tables and schema

## Migration Files

- `init/migrations/` - SQL migration files
  - `001-init.sql` - Initial database schema (users and urls tables)
- `init/run-migrations.sh` - Migration execution script
- `docker-compose.yml` - Updated with migrate service and dependencies

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

## Running the Application

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f migrate
docker-compose logs -f backend
```

## Manual Database Operations

If you need to run database operations manually:

```bash
# Run database migration only
docker-compose run --rm migrate

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d test

# View migration logs
docker-compose logs migrate
```

## Environment Variables

The following environment variables are used by the migrate service:

- `DB_HOST` - PostgreSQL host (default: postgres)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - PostgreSQL username (default: postgres)
- `DB_PASSWORD` - PostgreSQL password (default: password)
- `DB_NAME` - Target database name (default: test)

## Adding New Migrations

To add new migrations:

1. Create a new SQL file in `init/migrations/` with a sequential number:
   ```bash
   # Example: 002-add-clicks-table.sql
   touch init/migrations/002-add-clicks-table.sql
   ```

2. Add your SQL schema changes to the file:
   ```sql
   -- Add clicks table for analytics
   CREATE TABLE IF NOT EXISTS clicks (
     id SERIAL PRIMARY KEY,
     url_id INTEGER REFERENCES urls(id),
     ip_address INET,
     user_agent TEXT,
     clicked_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. The migration will automatically run when you restart the services:
   ```bash
   docker-compose down
   docker-compose up
   ```

## Benefits

1. **Separation of Concerns** - Database initialization is separate from application startup
2. **Reliability** - Backend only starts after database is fully initialized
3. **Idempotency** - Can be run multiple times safely (uses IF NOT EXISTS)
4. **Debugging** - Easy to see database initialization logs separately
5. **Version Control** - All schema changes are tracked in Git
6. **Simplicity** - Uses plain SQL files instead of complex ORM migrations

## Troubleshooting

### Common Issues

1. **Migration fails with "database does not exist"**
   - The migrate service should create the database automatically
   - Check that the `DB_NAME` environment variable is set correctly

2. **Permission denied errors**
   - Ensure the PostgreSQL user has proper permissions
   - Check that `DB_USER` and `DB_PASSWORD` match the PostgreSQL configuration

3. **Migration files not found**
   - Verify that migration files exist in `init/migrations/`
   - Check file permissions on the migration script

### Debugging Commands

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres pg_isready -U postgres

# List all tables in the database
docker-compose exec postgres psql -U postgres -d test -c "\dt"
```

## Production Considerations

For production deployments:

1. **Backup Strategy** - Implement regular database backups
2. **Migration Testing** - Test migrations on staging environment first
3. **Rollback Plan** - Have a plan to rollback schema changes if needed
4. **Monitoring** - Monitor database performance and connection health
5. **Security** - Use strong passwords and restrict database access 