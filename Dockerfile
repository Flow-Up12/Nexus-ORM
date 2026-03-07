# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all deps (including dev for build)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY . .

# Build Vite frontend
RUN npm run studio:build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install prod deps only
RUN npm ci --omit=dev

# Copy prisma
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy built app and routes from builder (JSON form handles spaces in paths)
COPY --from=builder ["/app/Nexus ORM/app/dist", "./Nexus ORM/app/dist"]
COPY --from=builder ["/app/Nexus ORM/routes", "./Nexus ORM/routes"]

# Copy server source
COPY src ./src
COPY lib ./lib

# Create startup script (migrate deploy, then start server)
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'npx prisma migrate deploy 2>/dev/null || true' >> /app/start.sh && \
    echo 'exec npx tsx src/server.ts' >> /app/start.sh && \
    chmod +x /app/start.sh

# tsx needed at runtime for .ts files
RUN npm install tsx --save

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["/app/start.sh"]
