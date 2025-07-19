# Database Migrations

This document explains how to set up and manage the database for the URL Shortener application.

## Prerequisites

1. PostgreSQL installed and running
2. Environment variables configured (see `.env.example`)

## Database Setup

### 1. Create the database

```bash
pnpm run db:create
```

### 2. Run migrations

```bash
pnpm run db:migrate
```

This will create the following tables:
- `users` - User accounts and authentication
- `urls` - Shortened URLs with metadata
- `clicks` - Click tracking for analytics

### 3. (Optional) Seed with demo data

```bash
pnpm run db:seed:all
```

This creates:
- Demo user: `demo@example.com` / `password123`
- Sample shortened URLs

## Available Commands

- `pnpm run db:create` - Create the database
- `pnpm run db:drop` - Drop the database
- `pnpm run db:migrate` - Run all pending migrations
- `pnpm run db:migrate:undo` - Undo the last migration
- `pnpm run db:migrate:undo:all` - Undo all migrations
- `pnpm run db:seed:all` - Run all seeders
- `pnpm run db:seed:undo:all` - Undo all seeders

## Database Schema

### users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `username` - Optional unique username
- `isActive` - Account status
- `lastLoginAt` - Last login timestamp
- `createdAt` / `updatedAt` - Timestamps

### URLs Table
- `id` - Primary key
- `originalUrl` - The original long URL
- `shortCode` - Unique short code (max 10 chars)
- `title` - Optional title for the URL
- `description` - Optional description
- `userId` - Foreign key to users (nullable for anonymous URLs)
- `isActive` - URL status
- `expiresAt` - Optional expiration date
- `clickCount` - Number of clicks
- `lastClickedAt` - Last click timestamp
- `createdAt` / `updatedAt` - Timestamps

### clicks Table
- `id` - Primary key
- `urlId` - Foreign key to URLs
- `ipAddress` - Visitor's IP address
- `userAgent` - Browser/device information
- `referer` - Referring URL
- `country` - Visitor's country (2-letter code)
- `city` - Visitor's city
- `clickedAt` - Click timestamp

## Environment Variables

Make sure your `.env` file contains:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=url
NODE_ENV=development
```

## Docker Setup

The application now includes automatic database initialization when running in Docker:

1. **Database Creation**: The application automatically creates the database if it doesn't exist
2. **Migration Running**: All migrations are automatically applied on startup
3. **Health Checks**: The application waits for PostgreSQL to be ready before starting

### Running with Docker Compose

```bash
# Start all services
docker-compose up

# Start only backend and database
docker-compose up postgres backend

# Rebuild and start
docker-compose up --build
```

### Manual Docker Setup

```bash
# Start PostgreSQL
docker run --name postgres-url-shortener \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:15

# Build and run backend
docker build -t url-shortener-backend ./backend
docker run --name url-shortener-backend \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=password \
  -e DB_NAME=url \
  -p 3001:3001 \
  url-shortener-backend
```

## Troubleshooting

If you encounter connection errors:

1. Ensure PostgreSQL is running
2. Check your environment variables
3. Verify the database exists: `pnpm run db:create`
4. Run migrations: `pnpm run db:migrate`

### Docker Troubleshooting

- **Database connection failed**: Ensure PostgreSQL container is running and healthy
- **Permission denied**: Check if the database user has proper permissions
- **Migration errors**: Check logs for specific migration failures 