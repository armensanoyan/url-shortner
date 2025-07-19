# URL Shortener System Architecture

This document provides a comprehensive overview of the URL shortener system architecture, including data models, API design, security measures, and technical implementation details.

## System Overview

The URL shortener is a full-stack web application built with:
- **Backend**: Node.js with Express.js, TypeScript, and PostgreSQL
- **Frontend**: Next.js with TypeScript (separate repository)
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based authentication
- **Security**: bcrypt for password hashing, rate limiting, input validation

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Middleware    │
                       │  (Auth, Rate    │
                       │   Limiting,     │
                       │   Validation)   │
                       └─────────────────┘
```

## Data Models

### User Model

The User model represents authenticated users in the system.

**Fields:**
- `id` (SERIAL PRIMARY KEY): Unique user identifier
- `email` (VARCHAR(255) UNIQUE): User's email address (lowercased)
- `password` (VARCHAR(255)): Hashed password using bcrypt
- `firstName` (VARCHAR(255)): User's first name (optional)
- `lastName` (VARCHAR(255)): User's last name (optional)
- `isActive` (BOOLEAN): Account status (default: true)
- `lastLoginAt` (TIMESTAMP WITH TIME ZONE): Last login timestamp
- `createdAt` (TIMESTAMP WITH TIME ZONE): Account creation timestamp
- `updatedAt` (TIMESTAMP WITH TIME ZONE): Last update timestamp

**Methods:**
- `comparePassword(candidatePassword)`: Compares password with bcrypt
- `updateLastLogin()`: Updates last login timestamp

**Hooks:**
- `beforeCreate`: Hashes password with bcrypt (12 salt rounds)
- `beforeUpdate`: Re-hashes password if changed

### URL Model

The URL model represents shortened URLs in the system.

**Fields:**
- `id` (SERIAL PRIMARY KEY): Unique URL identifier
- `slug` (VARCHAR(255) UNIQUE): Short identifier for the URL
- `originalUrl` (TEXT): The original long URL
- `title` (VARCHAR(255)): Optional title for the URL
- `description` (TEXT): Optional description
- `userId` (INTEGER): Foreign key to users table (nullable)
- `isActive` (BOOLEAN): Soft delete flag (default: true)
- `visitCount` (INTEGER): Number of visits (default: 0)
- `lastVisitedAt` (TIMESTAMP WITH TIME ZONE): Last visit timestamp
- `expiresAt` (TIMESTAMP WITH TIME ZONE): Optional expiration date
- `createdAt` (TIMESTAMP WITH TIME ZONE): Creation timestamp
- `updatedAt` (TIMESTAMP WITH TIME ZONE): Last update timestamp

**Methods:**
- `incrementVisitCount()`: Increments visit count and updates last visited
- `isExpired()`: Checks if URL has expired

**Associations:**
- `belongsTo(User)`: Links URL to user (optional)

**Indexes:**
- `slug` (unique): For fast slug lookups
- `userId`: For user-specific queries
- `isActive`: For filtering active URLs
- `createdAt`: For sorting and pagination
- `visitCount`: For analytics and sorting

## API Design

### Authentication Flow

1. **Registration**: User provides email, password, and optional name
   - Password is hashed with bcrypt
   - JWT token is generated and returned
   - User is automatically logged in

2. **Login**: User provides email and password
   - Password is verified with bcrypt
   - JWT token is generated and returned
   - Last login timestamp is updated

3. **Token Validation**: JWT token is verified on protected routes
   - Token is decoded and user is fetched from database
   - User must be active to access protected routes

### URL Management Flow

1. **URL Creation**: Authenticated user creates shortened URL
   - Custom slug is validated and made unique
   - URL is stored with user association
   - Shortened URL is generated and returned

2. **URL Retrieval**: User can view their URLs with pagination
   - Supports search across slug, URL, title, and description
   - Supports sorting by various fields
   - Includes user information in responses

3. **URL Updates**: User can update their URLs
   - All fields are optional for updates
   - Slug changes are validated for uniqueness
   - Soft delete sets isActive to false

4. **URL Analytics**: User can view visit statistics
   - Visit count and last visited timestamp
   - Dashboard statistics for all user URLs

### Redirect Flow

1. **Public Redirect**: Anyone can access shortened URLs
   - Slug is looked up in database
   - URL must be active and not expired
   - Visit count is incremented
   - HTTP 302 redirect to original URL

## Security Implementation

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 6 characters, must contain uppercase, lowercase, and number
- **Storage**: Only hashed passwords are stored

### JWT Security
- **Secret**: Environment variable (JWT_SECRET)
- **Expiration**: 7 days
- **Payload**: User ID and email only
- **Validation**: Token verification on every protected request

### Input Validation
- **Zod Schemas**: Type-safe validation for all inputs
- **Sanitization**: Automatic trimming and case normalization
- **URL Validation**: Ensures valid URLs with protocol
- **Slug Validation**: Alphanumeric + underscore + hyphen only

### Rate Limiting
- **Authentication**: 5 requests per 15 minutes per IP
- **Registration**: 3 requests per hour per IP (configurable)
- **Password Changes**: 3 requests per 15 minutes per IP
- **URL Operations**: 20 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP

### Database Security
- **Constraints**: Database-level validation for data integrity
- **Indexes**: Optimized queries for performance
- **Soft Deletes**: Data preservation with isActive flag
- **Foreign Keys**: Referential integrity with cascade options

## Error Handling

### Consistent Error Format
All API responses follow a consistent format:
```json
{
  "success": boolean,
  "message": "Error description",
  "data": {} // Optional data payload
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `410`: Gone (expired resource)
- `429`: Too Many Requests
- `500`: Internal Server Error

### Validation Errors
Zod validation errors are automatically formatted and returned with appropriate HTTP status codes.

## Database Design

### Schema Constraints
```sql
-- Users table constraints
ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');

-- URLs table constraints
ALTER TABLE urls ADD CONSTRAINT check_slug_format 
  CHECK (slug ~ '^[a-zA-Z0-9_-]+$' AND length(slug) >= 3 AND length(slug) <= 255);

ALTER TABLE urls ADD CONSTRAINT check_url_format 
  CHECK ("originalUrl" ~ '^https?://');

ALTER TABLE urls ADD CONSTRAINT check_title_length 
  CHECK (title IS NULL OR (length(title) >= 1 AND length(title) <= 255));

ALTER TABLE urls ADD CONSTRAINT check_description_length 
  CHECK (description IS NULL OR length(description) <= 1000);

ALTER TABLE urls ADD CONSTRAINT check_visit_count 
  CHECK ("visitCount" >= 0);
```

### Triggers
```sql
-- Automatic updatedAt timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_urls_updated_at 
    BEFORE UPDATE ON urls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Performance Considerations

### Database Optimization
- **Indexes**: Strategic indexing for common query patterns
- **Pagination**: Efficient pagination with LIMIT/OFFSET
- **Search**: Case-insensitive search with ILIKE
- **Associations**: Eager loading of related data

### Caching Strategy
- **JWT Tokens**: Stateless authentication (no server-side storage)
- **URL Lookups**: Database queries for each redirect (consider Redis for high traffic)
- **User Sessions**: No server-side session storage

### Scalability
- **Horizontal Scaling**: Stateless design allows multiple server instances
- **Database**: PostgreSQL can handle significant load
- **Rate Limiting**: IP-based rate limiting prevents abuse
- **Soft Deletes**: Preserves data for analytics and recovery

## Deployment Considerations

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Security
JWT_SECRET=your_jwt_secret

# Application
BASE_URL=http://localhost:3001
PORT=3001

# Rate Limiting
MAX_REQUEST_ATTEMPTS=3
WINDOW_MS=3600000
```

### Production Checklist
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up rate limiting
- [ ] Enable Helmet security headers
- [ ] Configure proper error handling
- [ ] Set up health checks
- [ ] Configure environment-specific settings

## Future Enhancements

### Potential Improvements
1. **Redis Integration**: Cache frequently accessed URLs
2. **Analytics**: More detailed visit analytics and reporting
3. **Custom Domains**: Support for custom domains
4. **QR Codes**: Generate QR codes for shortened URLs
5. **Bulk Operations**: Import/export multiple URLs
6. **API Keys**: Support for API key authentication
7. **Webhooks**: Notify external services of URL events
8. **Advanced Analytics**: Geographic and device analytics
9. **URL Expiration**: Automatic cleanup of expired URLs
10. **Multi-tenancy**: Support for organizations and teams 