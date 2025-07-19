# Authentication System Documentation

This document describes the authentication system implemented in the URL Shortener backend.

## Overview

The authentication system provides secure user registration, login, and session management using JWT (JSON Web Tokens) with the following features:

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting for security
- Input validation
- Account management (profile updates, password changes, deactivation)

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum password length: 6 characters
- Password complexity requirements: at least one uppercase letter, one lowercase letter, and one number

### Rate Limiting
- **Login attempts**: 5 attempts per 15 minutes
- **Registration attempts**: 3 attempts per hour
- **Password change attempts**: 3 attempts per 15 minutes
- **General API**: 100 requests per 15 minutes

### JWT Configuration
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are signed with a secret key (configured via `JWT_SECRET`)

## API Endpoints

### Public Endpoints

#### POST /auth/register
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
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/login
Authenticate user and receive access token.

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
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/logout
Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Protected Endpoints

All protected endpoints require the `Authorization` header with a valid JWT token:
```
Authorization: Bearer <token>
```

#### GET /auth/profile
Get current user's profile information.

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
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT /auth/profile
Update user profile information.

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
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT /auth/change-password
Change user password.

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

#### DELETE /auth/deactivate
Deactivate user account.

**Response:**
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "code": "invalid_string"
    }
  ]
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### Rate Limiting Errors (429)
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later",
  "retryAfter": 900
}
```

### Server Errors (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

Required environment variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret (optional, defaults to JWT_SECRET)

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=url_shortener
```

## Usage Examples

### Frontend Integration

#### Login Flow
```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token in localStorage or secure storage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

#### Protected API Calls
```javascript
const fetchProtectedData = async (url) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  
  return response.json();
};
```

#### Token Refresh (Optional)
```javascript
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.accessToken);
    return data.data.accessToken;
  } else {
    throw new Error('Token refresh failed');
  }
};
```

## Security Best Practices

1. **Environment Variables**: Never commit JWT secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Store tokens securely (httpOnly cookies for web apps)
4. **Token Expiration**: Use short-lived access tokens with refresh tokens
5. **Password Policy**: Enforce strong password requirements
6. **Rate Limiting**: Implement rate limiting on authentication endpoints
7. **Input Validation**: Validate all user inputs
8. **Error Handling**: Don't expose sensitive information in error messages

## Testing

You can test the authentication endpoints using tools like:

- **Postman**: Import the provided collection
- **cURL**: Use command-line examples
- **Frontend**: Integrate with your React/Next.js application

### Example cURL Commands

```bash
# Register a new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'

# Get profile (with token)
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
``` 