# ------------------------------
# Stage 1: Dependencies
# ------------------------------
FROM node:20-alpine AS deps

# Add libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install dependencies using legacy-peer-deps to avoid conflicts
RUN npm ci --legacy-peer-deps

# ------------------------------
# Stage 2: Builder
# ------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the app
COPY . .

# Build Next.js app
RUN npm run build

# ------------------------------
# Stage 3: Runner (Production)
# ------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]