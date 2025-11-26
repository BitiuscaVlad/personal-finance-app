# Multi-stage Dockerfile for Personal Finance App

# Stage 1: Build React client
FROM node:18-alpine AS client-build
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy client source
COPY client/ ./

# Build the React app
RUN npm run build

# Stage 2: Build server and final image
FROM node:18-alpine AS production
WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built client from previous stage
COPY --from=client-build /app/client/build ./public

# Create database directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
