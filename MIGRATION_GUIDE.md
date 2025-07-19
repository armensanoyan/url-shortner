# Migration Guide

This guide explains how to work with the SQL-based migration system used in this URL Shortener project.

## Overview

The project uses a simple SQL-based migration system with the following components:

- **Migration Files**: SQL files in `init/migrations/` directory
- **Migration Service**: Docker service that runs migrations before the backend starts
- **Execution Script**: `init/run-migrations.sh` that handles the migration process

## Migration Process

### How It Works

1. **Service Startup**: When you run `docker-compose up`, the services start in this order:
   - `postgres` starts and becomes healthy
   - `migrate` service runs and executes all SQL files
   - `backend` starts after migrations complete
   - `frontend` starts after backend is ready

2. **Migration Execution**: The `run-migrations.sh` script:
   - Waits for PostgreSQL to be ready
   - Creates the database if it doesn't exist
   - Executes all `.sql` files in `init/migrations/` in alphabetical order
   - Uses `IF NOT EXISTS` to make migrations idempotent

### Current Migrations

- `001-init.sql` - Creates the initial schema:
  - `users` table for user accounts
  - `urls` table for shortened URLs

## Adding New Migrations

### Step 1: Create Migration File

Create a new SQL file in the `init/migrations/` directory with a sequential number:

```bash
# Example: Add a new migration for analytics
touch init/migrations/002-add-analytics.sql
```

### Step 2: Write Migration SQL

Add your SQL schema changes to the file:

```sql
-- 002-add-analytics.sql
-- Add analytics tables for tracking URL clicks

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_clicks_ip_address ON clicks(ip_address);

-- Add click_count column to urls table
ALTER TABLE urls ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE urls ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP;

-- Create function to update click count
CREATE OR REPLACE FUNCTION update_url_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE urls 
  SET click_count = click_count + 1,
      last_clicked_at = NOW()
  WHERE id = NEW.url_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update click count
DROP TRIGGER IF EXISTS trigger_update_click_count ON clicks;
CREATE TRIGGER trigger_update_click_count
  AFTER INSERT ON clicks
  FOR EACH ROW
  EXECUTE FUNCTION update_url_click_count();
```

### Step 3: Test Migration

Test your migration by running:

```bash
# Stop all services
docker-compose down

# Start services to run migrations
docker-compose up
```

### Step 4: Verify Migration

Check that your migration worked correctly:

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d test

# List all tables
\dt

# Check table structure
\d clicks

# Check if indexes were created
\di

# Check if trigger was created
\dg
```

## Migration Best Practices

### 1. Use Sequential Numbering

Always use sequential numbers for migration files:
- `001-init.sql`
- `002-add-analytics.sql`
- `003-add-user-preferences.sql`

### 2. Use IF NOT EXISTS

Always use `IF NOT EXISTS` to make migrations idempotent:

```sql
-- Good
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL
);

-- Bad - will fail if table exists
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL
);
```

### 3. Add Descriptive Comments

Include clear comments explaining what the migration does:

```sql
-- Migration: 002-add-analytics.sql
-- Purpose: Add analytics tables for tracking URL clicks
-- Date: 2024-01-15
-- Author: Your Name

-- Create clicks table for storing click analytics
CREATE TABLE IF NOT EXISTS clicks (
  -- ... table definition
);
```

### 4. Include Indexes

Add appropriate indexes for performance:

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_urls_short_url ON urls(short_url);
```

### 5. Handle Foreign Keys

Always define foreign key relationships:

```sql
-- Good - with proper foreign key
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  -- ... other columns
);

-- Bad - no foreign key constraint
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  url_id INTEGER NOT NULL,
  -- ... other columns
);
```

### 6. Test Migrations

Always test migrations before deploying:

```bash
# Test on a fresh database
docker-compose down -v
docker-compose up

# Verify schema
docker-compose exec postgres psql -U postgres -d test -c "\dt"
```

## Common Migration Patterns

### Adding a New Table

```sql
-- Create new table
CREATE TABLE IF NOT EXISTS table_name (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_table_name_name ON table_name(name);
```

### Adding Columns to Existing Table

```sql
-- Add new columns
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_column TEXT;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS another_column INTEGER DEFAULT 0;
```

### Creating Relationships

```sql
-- Add foreign key to existing table
ALTER TABLE child_table 
ADD COLUMN IF NOT EXISTS parent_id INTEGER,
ADD CONSTRAINT fk_child_parent 
FOREIGN KEY (parent_id) REFERENCES parent_table(id) ON DELETE CASCADE;
```

### Adding Constraints

```sql
-- Add unique constraint
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_user_email UNIQUE (email);

-- Add check constraint
ALTER TABLE urls ADD CONSTRAINT IF NOT EXISTS valid_url CHECK (original_url LIKE 'http%');
```

## Troubleshooting Migrations

### Common Issues

1. **Migration fails with syntax error**
   ```bash
   # Check SQL syntax
   docker-compose logs migrate
   
   # Test SQL manually
   docker-compose exec postgres psql -U postgres -d test -f /migrations/your-migration.sql
   ```

2. **Table already exists error**
   - Use `IF NOT EXISTS` in all CREATE statements
   - Check if migration was already run

3. **Foreign key constraint fails**
   - Ensure referenced table exists
   - Check data integrity in existing tables

4. **Permission denied**
   - Verify database user has proper permissions
   - Check environment variables

### Debugging Commands

```bash
# View migration logs
docker-compose logs migrate

# Check database state
docker-compose exec postgres psql -U postgres -d test -c "\dt"

# Test specific migration
docker-compose exec postgres psql -U postgres -d test -f /migrations/your-migration.sql

# Reset and test from scratch
docker-compose down -v
docker-compose up
```

## Production Considerations

### Migration Safety

1. **Backup First**: Always backup the database before running migrations
2. **Test on Staging**: Test migrations on staging environment first
3. **Rollback Plan**: Have a plan to rollback if migration fails
4. **Downtime**: Consider if migration requires downtime

### Performance

1. **Large Tables**: For large tables, consider running migrations during low-traffic periods
2. **Indexes**: Add indexes after data migration to speed up the process
3. **Batch Operations**: For large data changes, use batch operations

### Monitoring

1. **Migration Logs**: Monitor migration logs for errors
2. **Database Performance**: Monitor database performance after migrations
3. **Application Health**: Verify application works correctly after migrations

## Example: Complete Migration Workflow

Here's a complete example of adding a new feature with migrations:

### 1. Create Migration File

```bash
touch init/migrations/002-add-user-preferences.sql
```

### 2. Write Migration

```sql
-- 002-add-user-preferences.sql
-- Add user preferences and settings

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint
ALTER TABLE user_preferences ADD CONSTRAINT IF NOT EXISTS unique_user_preferences UNIQUE (user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Test Migration

```bash
# Test migration
docker-compose down -v
docker-compose up

# Verify
docker-compose exec postgres psql -U postgres -d test -c "\dt"
docker-compose exec postgres psql -U postgres -d test -c "\d user_preferences"
```

### 4. Update Application Code

Update your backend models and API to use the new table.

### 5. Deploy

Deploy the migration along with your application code.

This migration system provides a simple, reliable way to manage database schema changes while maintaining consistency across development, staging, and production environments. 