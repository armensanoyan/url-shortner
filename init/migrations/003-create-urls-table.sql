-- Create URLs table
CREATE TABLE IF NOT EXISTS urls (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_urls_slug ON urls(slug);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls("userId");
CREATE INDEX IF NOT EXISTS idx_urls_is_active ON urls("isActive");
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls("createdAt");
CREATE INDEX IF NOT EXISTS idx_urls_visit_count ON urls("visitCount");

-- Add constraint to ensure slug format
ALTER TABLE urls ADD CONSTRAINT check_slug_format 
  CHECK (slug ~ '^[a-zA-Z0-9_-]+$' AND length(slug) >= 3 AND length(slug) <= 255);

-- Add constraint to ensure URL format
ALTER TABLE urls ADD CONSTRAINT check_url_format 
  CHECK ("originalUrl" ~ '^https?://');

-- Add constraint to ensure title length
ALTER TABLE urls ADD CONSTRAINT check_title_length 
  CHECK (title IS NULL OR (length(title) >= 1 AND length(title) <= 255));

-- Add constraint to ensure description length
ALTER TABLE urls ADD CONSTRAINT check_description_length 
  CHECK (description IS NULL OR length(description) <= 1000);

-- Add constraint to ensure visit count is non-negative
ALTER TABLE urls ADD CONSTRAINT check_visit_count 
  CHECK ("visitCount" >= 0);

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_urls_updated_at 
  BEFORE UPDATE ON urls 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 