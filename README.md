# URL Shortener

A full-stack URL shortener application built with Next.js, Express.js, PostgreSQL, and Docker.

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript, Sequelize ORM
- **Database**: PostgreSQL
- **Package Manager**: pnpm
- **Containerization**: Docker & Docker Compose

## Project Structure

```
url-shortner/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Main entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── MIGRATIONS.md       # Backend migration documentation
│   └── env.example
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility libraries
│   │   └── types/         # TypeScript type definitions
│   ├── package.json
│   ├── next.config.js
│   ├── Dockerfile
│   └── env.example
├── init/                   # Database initialization
│   ├── migrations/         # SQL migration files
│   │   └── 001-init.sql   # Initial database schema
│   └── run-migrations.sh  # Migration execution script
├── docker-compose.yml      # Docker orchestration
├── DATABASE_SETUP.md       # Database setup documentation
├── MIGRATION_GUIDE.md      # Comprehensive migration guide
├── .dockerignore
└── README.md
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- pnpm (optional, for local development)

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd url-shortner
   ```

2. Start all services:
   ```bash
   docker-compose up --build
   ```

   This will automatically:
   - Start PostgreSQL database
   - Run all SQL migrations
   - Start the backend application
   - Start the frontend application

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5431 (mapped from container port 5432)

### Local Development

1. Install dependencies:
   ```bash
   # Backend
   cd backend
   pnpm install
   cp env.example .env
   
   # Frontend
   cd ../frontend
   pnpm install
   cp env.example .env.local
   ```

2. Start PostgreSQL database and run migrations (using Docker):
   ```bash
   # Start database and run migrations
   docker-compose up postgres migrate
   
   # Or start everything
   docker-compose up
   ```

3. Start the backend:
   ```bash
   cd backend
   pnpm run dev
   ```

4. Start the frontend:
   ```bash
   cd frontend
   pnpm run dev
   ```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5431
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=test
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

- `GET /` - Health check
- `GET /health` - API status
- `POST /api/urls` - Create short URL
- `GET /api/urls` - List all URLs
- `GET /:slug` - Redirect to original URL

## Features

- [x] URL shortening
- [x] Database storage
- [x] Unique slug generation
- [x] URL redirection
- [x] 404 handling
- [x] URL listing
- [ ] User authentication
- [ ] URL validation
- [ ] Copy to clipboard
- [ ] Custom slugs
- [ ] Visit tracking
- [ ] Rate limiting
- [ ] Analytics dashboard

## Development

### Backend Commands
```bash
cd backend
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run start    # Start production server
```

### Frontend Commands
```bash
cd frontend
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run start    # Start production server
pnpm run lint     # Run ESLint
```

## Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f migrate
docker-compose logs -f backend

# Access specific service
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgres psql -U postgres -d test

# Run migrations only
docker-compose run --rm migrate

# Reset database (WARNING: This will delete all data)
docker-compose down -v
docker-compose up
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 