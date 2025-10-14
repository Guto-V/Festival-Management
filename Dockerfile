# Multi-stage build for production efficiency
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY frontend/ ./
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY backend/ ./
RUN npm run build 2>/dev/null || echo "No build script found, using source"

# Production stage
FROM node:18-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S festival -u 1001

# Install production dependencies
RUN apk add --no-cache sqlite curl

# Create app directories
WORKDIR /app
RUN mkdir -p logs data uploads && chown -R festival:nodejs /app

# Copy built applications
COPY --from=builder --chown=festival:nodejs /app/backend /app/backend
COPY --from=builder --chown=festival:nodejs /app/frontend/build /app/frontend/build

# Copy configuration files
COPY --chown=festival:nodejs docker-entrypoint.sh /app/
COPY --chown=festival:nodejs .dockerignore /app/
RUN chmod +x /app/docker-entrypoint.sh

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_BUILD_PATH=/app/frontend/build

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Switch to non-root user
USER festival

# Expose port
EXPOSE 3001

# Start application
ENTRYPOINT ["/app/docker-entrypoint.sh"]