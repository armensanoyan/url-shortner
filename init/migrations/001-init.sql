-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,

  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create urls table
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

