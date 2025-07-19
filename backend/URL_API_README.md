# URL Shortener API Documentation

This document describes the URL shortener API endpoints and their usage.

## Base URL
```
http://localhost:3001
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "lastLoginAt": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T12:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login User
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "lastLoginAt": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T12:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get User Profile
**GET** `/auth/profile`

Get the current user's profile information. Authentication required.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "lastLoginAt": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 4. Update User Profile
**PUT** `/auth/profile`

Update the current user's profile information. Authentication required.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "isActive": true,
      "lastLoginAt": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 5. Change Password
**PUT** `/auth/change-password`

Change the current user's password. Authentication required.

**Request Body:**
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 6. Deactivate Account
**DELETE** `/auth/deactivate`

Deactivate the current user's account. Authentication required.

**Response:**
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

### 7. Logout
**POST** `/auth/logout`

Logout the current user. Authentication required.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## URL Management Endpoints

### 1. Create Shortened URL
**POST** `/api/urls`

Create a new shortened URL. Authentication is required.

**Request Body:**
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "title": "My Shortened Link",
  "description": "Optional description",
  "slug": "custom-slug",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "abc123",
    "originalUrl": "https://example.com/very/long/url",
    "title": "My Shortened Link",
    "description": "Optional description",
    "shortenedUrl": "http://localhost:3001/abc123",
    "expiresAt": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### 2. Get All URLs
**GET** `/api/urls`

Get all URLs for the authenticated user with pagination, search, and sorting.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term for slug, URL, title, or description
- `sortBy` (optional): Sort field (createdAt, updatedAt, visitCount, lastVisitedAt, title)
- `sortOrder` (optional): Sort order (asc, desc)

**Example:**
```
GET /api/urls?page=1&limit=10&search=example&sortBy=visitCount&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "urls": [
      {
        "id": 1,
        "slug": "abc123",
        "originalUrl": "https://example.com",
        "title": "Example",
        "description": "Example description",
        "shortenedUrl": "http://localhost:3001/abc123",
        "visitCount": 42,
        "lastVisitedAt": "2024-01-01T12:00:00Z",
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-01T12:00:00Z",
        "user": {
          "id": 1,
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 3. Get URL by ID
**GET** `/api/urls/:id`

Get a specific URL by ID. Only accessible by the URL owner.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "abc123",
    "originalUrl": "https://example.com",
    "title": "Example",
    "description": "Example description",
    "shortenedUrl": "http://localhost:3001/abc123",
    "visitCount": 42,
    "lastVisitedAt": "2024-01-01T12:00:00Z",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### 4. Update URL
**PUT** `/api/urls/:id`

Update a URL. Only accessible by the URL owner.

**Request Body:**
```json
{
  "slug": "new-slug",
  "originalUrl": "https://new-example.com",
  "title": "Updated Title",
  "description": "Updated description",
  "isActive": true,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "new-slug",
    "originalUrl": "https://new-example.com",
    "title": "Updated Title",
    "description": "Updated description",
    "shortenedUrl": "http://localhost:3001/new-slug",
    "isActive": true,
    "expiresAt": "2024-12-31T23:59:59Z",
    "visitCount": 42,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T13:00:00Z"
  }
}
```

### 5. Delete URL
**DELETE** `/api/urls/:id`

Soft delete a URL (sets isActive to false). Only accessible by the URL owner.

**Response:**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

### 6. Get URL Analytics
**GET** `/api/urls/:id/analytics`

Get analytics for a specific URL. Only accessible by the URL owner.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "abc123",
    "visitCount": 42,
    "lastVisitedAt": "2024-01-01T12:00:00Z",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 7. Get Dashboard Statistics
**GET** `/api/urls/dashboard/stats`

Get dashboard statistics for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUrls": 10,
    "totalVisits": 150,
    "popularUrls": [
      {
        "id": 1,
        "slug": "abc123",
        "title": "Popular URL",
        "visitCount": 42,
        "lastVisitedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "recentUrls": [
      {
        "id": 2,
        "slug": "def456",
        "title": "Recent URL",
        "visitCount": 5,
        "createdAt": "2024-01-01T14:00:00Z"
      }
    ]
  }
}
```

### 8. Redirect to Original URL
**GET** `/:slug`

Public endpoint to redirect to the original URL. No authentication required.

**Response:**
- **Success**: HTTP 302 redirect to the original URL
- **Not Found**: HTTP 404 with error message
- **Expired**: HTTP 410 with error message

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (slug already taken)
- `410`: Gone (URL has expired)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Rate Limiting

- **Authentication (login)**: 5 requests per 15 minutes per IP
- **Registration**: 3 requests per hour per IP (configurable via MAX_REQUEST_ATTEMPTS and WINDOW_MS env vars)
- **Password changes**: 3 requests per 15 minutes per IP
- **URL operations**: 20 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP

## Validation Rules

### User Registration/Login
- `email`: Must be a valid email address, max 255 characters, automatically lowercased and trimmed
- `password`: 6-100 characters, must contain at least one uppercase letter, one lowercase letter, and one number
- `firstName`: Optional, 1-50 characters, trimmed
- `lastName`: Optional, 1-50 characters, trimmed

### Profile Updates
- At least one of `firstName` or `lastName` must be provided
- `firstName`: 1-50 characters, trimmed
- `lastName`: 1-50 characters, trimmed

### Password Changes
- `currentPassword`: Required
- `newPassword`: 6-100 characters, must contain at least one uppercase letter, one lowercase letter, and one number
- New password must be different from current password

### URL Creation/Update
- `originalUrl`: Must be a valid URL, max 2048 characters, automatically adds https:// if no protocol provided
- `title`: Optional, 1-255 characters, trimmed
- `description`: Optional, max 1000 characters, trimmed
- `slug`: Optional, 3-50 characters, alphanumeric + underscore + hyphen only, automatically lowercased and trimmed
- `expiresAt`: Optional, must be a valid future date
- `isActive`: Optional boolean for updates

### Query Parameters
- `page`: Must be a positive integer (default: 1)
- `limit`: Must be 1-100 (default: 10)
- `search`: Must be 1-100 characters, trimmed
- `sortBy`: Must be one of: createdAt, updatedAt, visitCount, lastVisitedAt, title (default: createdAt)
- `sortOrder`: Must be 'asc' or 'desc' (default: desc)

## Environment Variables

Make sure these environment variables are set:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
BASE_URL=http://localhost:3001
MAX_REQUEST_ATTEMPTS=3
WINDOW_MS=3600000
```

## Database Schema

### Users Table
- `id`: Primary key (SERIAL)
- `email`: Unique email address (VARCHAR(255))
- `password`: Hashed password (VARCHAR(255))
- `firstName`: Optional first name (VARCHAR(255))
- `lastName`: Optional last name (VARCHAR(255))
- `isActive`: Account status (BOOLEAN, default: true)
- `lastLoginAt`: Last login timestamp (TIMESTAMP WITH TIME ZONE)
- `createdAt`: Creation timestamp (TIMESTAMP WITH TIME ZONE)
- `updatedAt`: Last update timestamp (TIMESTAMP WITH TIME ZONE)

### URLs Table
- `id`: Primary key (SERIAL)
- `slug`: Unique identifier for the shortened URL (VARCHAR(255), unique)
- `originalUrl`: The original long URL (TEXT)
- `title`: Optional title for the URL (VARCHAR(255))
- `description`: Optional description (TEXT)
- `userId`: Foreign key to users table (INTEGER, nullable for anonymous URLs)
- `isActive`: Soft delete flag (BOOLEAN, default: true)
- `visitCount`: Number of times the URL has been accessed (INTEGER, default: 0)
- `lastVisitedAt`: Timestamp of last visit (TIMESTAMP WITH TIME ZONE)
- `expiresAt`: Optional expiration date (TIMESTAMP WITH TIME ZONE)
- `createdAt`: Creation timestamp (TIMESTAMP WITH TIME ZONE)
- `updatedAt`: Last update timestamp (TIMESTAMP WITH TIME ZONE)

### Database Constraints
- Email must be unique
- Slug must be unique and match pattern: `^[a-zA-Z0-9_-]+$` (3-255 characters)
- URL must match pattern: `^https?://`
- Title length: 1-255 characters (if provided)
- Description length: max 1000 characters (if provided)
- Visit count must be non-negative
- Automatic `updatedAt` timestamp updates via triggers 