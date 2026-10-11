# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Base Image
# ============================================
FROM node:22-alpine AS base

# Install libc6-compat, openssl, and ca-certificates for Prisma and cloud SSL connections
RUN apk add --no-cache libc6-compat openssl ca-certificates

WORKDIR /app

# ============================================
# Stage 2: Install Dependencies
# ============================================
FROM base AS deps
WORKDIR /app

# Copy dependency definitions and Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install exact dependencies
RUN npm ci || npm install --legacy-peer-deps

# ============================================
# Stage 3: Build Application
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client for the Linux container architecture
RUN npx prisma generate

# Build Next.js application (generates standalone output)
RUN npm run build

# ============================================
# Stage 4: Production Runner
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script and ensure execution permissions
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown nextjs:nodejs ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
