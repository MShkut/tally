# Multi-stage build for Tally Budget App

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package*.json ./

# Use npm ci for faster builds
RUN npm ci

# Copy source files and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Node.js API server
FROM node:18-alpine AS api-builder

WORKDIR /app/api

# Install build dependencies first
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY backend/package*.json ./

# Use npm ci (remove --only=production to avoid issues)
RUN npm ci --verbose

# Stage 3: Final runtime image with node + nginx
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy nginx configuration (rarely changes)
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built frontend (changes with each build)
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy backend dependencies (already built with native modules)
COPY --from=api-builder /app/api/node_modules /app/api/node_modules
COPY backend/package.json /app/api/

# Copy backend source code (changes frequently, so do this last)
COPY backend/server.js /app/api/
COPY backend/database/ /app/api/database/
COPY backend/models/ /app/api/models/
COPY backend/middleware/ /app/api/middleware/
COPY backend/utils/ /app/api/utils/
COPY backend/routes/ /app/api/routes/

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Create data directory for budget files
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start both nginx and API server
CMD ["/start.sh"]
