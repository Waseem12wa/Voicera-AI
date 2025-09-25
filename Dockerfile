# Multi-stage build for Voicera AI
FROM node:18-alpine AS base

# Install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build main server
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./

# Build voice service
FROM node:18-alpine AS voice-build
WORKDIR /app/voice-service
COPY microservices/voice-service/package*.json ./
RUN npm ci
COPY microservices/voice-service/ ./

# Production image
FROM node:18-alpine AS production
WORKDIR /app

# Install PM2 for process management
RUN npm install -g pm2

# Copy built applications
COPY --from=server-build /app ./server
COPY --from=voice-build /app ./voice-service
COPY --from=frontend-build /app/dist ./frontend/dist

# Copy PM2 ecosystem file
COPY ecosystem.config.js ./

# Expose ports
EXPOSE 4000 3001 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start services
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
