#!/bin/bash
set -e

# Read environment variables (no defaults)
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Validate that all required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "Error: All database environment variables must be set:"
  echo "  DB_HOST: $DB_HOST"
  echo "  DB_PORT: $DB_PORT"
  echo "  DB_USER: $DB_USER"
  echo "  DB_PASSWORD: [hidden]"
  echo "  DB_NAME: $DB_NAME"
  exit 1
fi

# Construct the PostgreSQL connection string
PSQL_CONNECTION="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Construct connection string for default database (usually 'postgres')
DEFAULT_CONNECTION="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres"

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until psql "$DEFAULT_CONNECTION" -c '\q' 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - creating database if it doesn't exist"
psql "$DEFAULT_CONNECTION" -c "CREATE DATABASE \"${DB_NAME}\" WITH OWNER \"${DB_USER}\";" 2>/dev/null || echo "Database ${DB_NAME} already exists or could not be created"

echo "PostgreSQL is up - running migrations"

# Check if migrations directory exists and has files
if [ ! -d "/migrations" ]; then
  echo "Error: /migrations directory not found"
  exit 1
fi

# List all SQL files in migrations directory
echo "Found migration files:"
ls -la /migrations/*.sql 2>/dev/null || echo "No .sql files found in /migrations"

# Run each SQL file
for file in /migrations/*.sql; do
  if [ -f "$file" ]; then
    echo "Running migration: $file"
    psql "$PSQL_CONNECTION" -f "$file"
  fi
done

echo "Migrations completed"