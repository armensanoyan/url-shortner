# Data Models Documentation

This document provides detailed information about the database schema, data models, relationships, and constraints for the URL shortener system.

## Database Overview

The system uses PostgreSQL as the primary database with Sequelize ORM for data modeling and querying. The database consists of two main tables: `users` and `urls`.

## Table Schema

### Users Table

**Table Name:** `users`

**Purpose:** Stores user account information and authentication data.

**Schema:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255),
  "lastName" VARCHAR(255),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Field Descriptions:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address (lowercased) |
| `password` | VARCHAR(255) | NOT NULL | Hashed password using bcrypt |
| `firstName` | VARCHAR(255) | NULL | User's first name (optional) |
| `lastName` | VARCHAR(255) | NULL | User's last name (optional) |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Account status flag |
| `lastLoginAt` | TIMESTAMP WITH TIME ZONE | NULL | Last successful login timestamp |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
```

**Constraints:**
```sql
-- Email format validation (basic)
ALTER TABLE users ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');
```

### URLs Table

**Table Name:** `urls`

**Purpose:** Stores shortened URL information and analytics data.

**Schema:**
```sql
CREATE TABLE urls (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  "originalUrl" TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "visitCount" INTEGER NOT NULL DEFAULT 0,
  "lastVisitedAt" TIMESTAMP WITH TIME ZONE,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Field Descriptions:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | Short identifier for the URL |
| `originalUrl` | TEXT | NOT NULL | The original long URL |
| `title` | VARCHAR(255) | NULL | Optional title for the URL |
| `description` | TEXT | NULL | Optional description |
| `userId` | INTEGER | FOREIGN KEY, NULL | Reference to user who created the URL |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| `visitCount` | INTEGER | NOT NULL, DEFAULT 0 | Number of times URL was accessed |
| `lastVisitedAt` | TIMESTAMP WITH TIME ZONE | NULL | Last visit timestamp |
| `expiresAt` | TIMESTAMP WITH TIME ZONE | NULL | Optional expiration date |
| `createdAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
```sql
CREATE INDEX idx_urls_slug ON urls(slug);
CREATE INDEX idx_urls_user_id ON urls("userId");
CREATE INDEX idx_urls_is_active ON urls("isActive");
CREATE INDEX idx_urls_created_at ON urls("createdAt");
CREATE INDEX idx_urls_visit_count ON urls("visitCount");
```

**Constraints:**
```sql
-- Slug format validation
ALTER TABLE urls ADD CONSTRAINT check_slug_format 
CHECK (slug ~ '^[a-zA-Z0-9_-]+$' AND length(slug) >= 3 AND length(slug) <= 255);

-- URL format validation
ALTER TABLE urls ADD CONSTRAINT check_url_format 
CHECK ("originalUrl" ~ '^https?://');

-- Title length validation
ALTER TABLE urls ADD CONSTRAINT check_title_length 
CHECK (title IS NULL OR (length(title) >= 1 AND length(title) <= 255));

-- Description length validation
ALTER TABLE urls ADD CONSTRAINT check_description_length 
CHECK (description IS NULL OR length(description) <= 1000);

-- Visit count validation
ALTER TABLE urls ADD CONSTRAINT check_visit_count 
CHECK ("visitCount" >= 0);
```

## Relationships

### One-to-Many: User to URLs

A user can create multiple URLs, but each URL belongs to at most one user (or no user for anonymous URLs).

**Foreign Key:** `urls.userId` → `users.id`

**Cascade Behavior:** `ON DELETE SET NULL` - If a user is deleted, their URLs become anonymous (userId set to NULL).

**Sequelize Association:**
```typescript
User.hasMany(Url, {
  foreignKey: 'userId',
  as: 'urls',
});

Url.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});
```

## Data Model Classes

### User Model (TypeScript)

```typescript
interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> {
  // Instance methods
  public async comparePassword(candidatePassword: string): Promise<boolean>;
  public async updateLastLogin(): Promise<void>;
}
```

**Key Features:**
- Password hashing with bcrypt (12 salt rounds)
- Automatic password comparison method
- Last login tracking
- Soft delete support via `isActive` flag

### URL Model (TypeScript)

```typescript
interface UrlAttributes {
  id: number;
  slug: string;
  originalUrl: string;
  title?: string;
  description?: string;
  userId?: number;
  isActive: boolean;
  visitCount: number;
  lastVisitedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UrlCreationAttributes extends Optional<UrlAttributes, 'id' | 'isActive' | 'visitCount' | 'createdAt' | 'updatedAt'> {}

class Url extends Model<UrlAttributes, UrlCreationAttributes> {
  // Instance methods
  public async incrementVisitCount(): Promise<void>;
  public isExpired(): boolean;
}
```

**Key Features:**
- Automatic visit count tracking
- Expiration date checking
- Soft delete support
- Optional user association

## Data Validation

### User Validation Rules

**Email:**
- Must be a valid email format
- Maximum 255 characters
- Automatically lowercased and trimmed
- Must be unique across all users

**Password:**
- Minimum 6 characters
- Maximum 100 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Hashed with bcrypt before storage

**Names:**
- `firstName`: Optional, 1-50 characters, trimmed
- `lastName`: Optional, 1-50 characters, trimmed

### URL Validation Rules

**Slug:**
- 3-50 characters
- Alphanumeric characters only (a-z, A-Z, 0-9)
- Underscores and hyphens allowed
- Must be unique across all URLs
- Automatically lowercased and trimmed

**Original URL:**
- Must be a valid URL format
- Maximum 2048 characters
- Must start with http:// or https://
- Automatically adds https:// if no protocol provided

**Title:**
- Optional
- 1-255 characters if provided
- Automatically trimmed

**Description:**
- Optional
- Maximum 1000 characters if provided
- Automatically trimmed

**Expiration Date:**
- Optional
- Must be a valid future date if provided

## Data Flow

### User Registration Flow

1. **Input Validation:** Validate email, password, and optional names
2. **Email Normalization:** Convert to lowercase and trim
3. **Password Hashing:** Hash password with bcrypt (12 rounds)
4. **Database Insert:** Create user record
5. **Token Generation:** Generate JWT token
6. **Response:** Return user data (without password) and token

### URL Creation Flow

1. **Input Validation:** Validate URL, title, description, and optional slug
2. **Slug Generation:** Generate unique slug if not provided
3. **URL Normalization:** Add protocol if missing
4. **Database Insert:** Create URL record with user association
5. **Response:** Return URL data with shortened URL

### URL Redirect Flow

1. **Slug Lookup:** Find URL by slug in database
2. **Validation:** Check if URL is active and not expired
3. **Visit Tracking:** Increment visit count and update last visited
4. **Redirect:** Return HTTP 302 redirect to original URL

## Database Triggers

### Automatic Timestamp Updates

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- URLs table trigger
CREATE TRIGGER update_urls_updated_at 
    BEFORE UPDATE ON urls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Query Patterns

### Common Queries

**Get User with URLs:**
```sql
SELECT u.*, json_agg(urls.*) as urls
FROM users u
LEFT JOIN urls ON u.id = urls."userId"
WHERE u.id = $1 AND u."isActive" = true
GROUP BY u.id;
```

**Get URLs with Pagination:**
```sql
SELECT * FROM urls
WHERE "userId" = $1 AND "isActive" = true
ORDER BY "createdAt" DESC
LIMIT $2 OFFSET $3;
```

**Search URLs:**
```sql
SELECT * FROM urls
WHERE "userId" = $1 AND "isActive" = true
AND (
  slug ILIKE $2 OR
  "originalUrl" ILIKE $2 OR
  title ILIKE $2 OR
  description ILIKE $2
)
ORDER BY "createdAt" DESC;
```

**Get URL by Slug:**
```sql
SELECT * FROM urls
WHERE slug = $1 AND "isActive" = true
AND ("expiresAt" IS NULL OR "expiresAt" > NOW());
```

## Performance Considerations

### Index Strategy

1. **Primary Keys:** Auto-indexed by PostgreSQL
2. **Unique Constraints:** Automatically create indexes
3. **Foreign Keys:** Indexed for join performance
4. **Search Fields:** Indexed for ILIKE queries
5. **Sort Fields:** Indexed for ORDER BY performance

### Query Optimization

1. **Pagination:** Use LIMIT/OFFSET for large result sets
2. **Selective Queries:** Only select needed fields
3. **Eager Loading:** Load associations when needed
4. **Search Optimization:** Use ILIKE with proper indexing

### Data Integrity

1. **Constraints:** Database-level validation
2. **Triggers:** Automatic timestamp updates
3. **Foreign Keys:** Referential integrity
4. **Soft Deletes:** Data preservation
5. **Validation:** Application-level validation with Zod

## Migration Strategy

### Database Migrations

The system uses SQL migration files for schema changes:

1. **001-initial-setup.sql:** Database initialization
2. **002-create-users-table.sql:** Users table creation
3. **003-create-urls-table.sql:** URLs table creation

### Migration Execution

```bash
# Run migrations
./init/run-migrations.sh
```

### Schema Evolution

When adding new fields or tables:

1. Create new migration file
2. Add constraints and indexes
3. Update model definitions
4. Update validation schemas
5. Test thoroughly

## Backup and Recovery

### Backup Strategy

1. **Regular Backups:** Daily automated backups
2. **Point-in-Time Recovery:** WAL archiving
3. **Data Export:** JSON/CSV exports for analysis
4. **Configuration Backup:** Environment and config files

### Recovery Procedures

1. **Full Restore:** Restore from backup
2. **Partial Restore:** Restore specific tables
3. **Data Migration:** Migrate between environments
4. **Rollback:** Revert to previous schema version 