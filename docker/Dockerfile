# Multi-stage build for Tally Budget App
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Node.js API server
FROM node:18-alpine AS api-builder

WORKDIR /app/api
COPY docker/package*.json ./
RUN npm ci --only=production

# Stage 3: Final runtime image with nginx + node
FROM nginx:alpine

# Install Node.js for the API server
RUN apk add --no-cache nodejs npm

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy API server and dependencies
COPY --from=api-builder /app/api/node_modules /app/api/node_modules
COPY docker/server.js /app/api/
COPY docker/package.json /app/api/

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Copy Start9 scripts (backup, restore, health-check)
COPY startos/health-check.sh /health-check.sh
COPY startos/scripts/ /scripts/
RUN chmod +x /health-check.sh && \
    find /scripts -type f -name "*.sh" -exec chmod +x {} \;

# Create data directory for budget files
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start both nginx and API server
CMD ["/start.sh"]