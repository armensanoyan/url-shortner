FROM node:22-alpine

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy entrypoint script first and set permissions
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && ls -la docker-entrypoint.sh

# Copy rest of source code
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3001

# Use entrypoint script with explicit shell
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]

# Start the application
CMD ["pnpm", "start"] 