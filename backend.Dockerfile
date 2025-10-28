# Use Debian-based Bun image (not Alpine!)
FROM oven/bun:1.1

# Install system dependencies required by Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libxrandr2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    fonts-liberation \
    libappindicator3-1 \
    libx11-6 \
    libxext6 \
    libxfixes3 \
    libxrender1 \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app/backend

# Accept database URLs as build arguments
ARG DATABASE_URL
ARG SHADOW_DATABASE_URL

# Tell Puppeteer to use system Chromium instead of downloading its own
# MUST be set BEFORE bun install to prevent Puppeteer's postinstall download
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy dependency files
COPY backend/package.json backend/bun.lockb ./

# Copy Prisma schema needed for postinstall
COPY backend/src/prisma ./src/prisma

# Install dependencies with optimizations:
# - Ignore all postinstall scripts to avoid slow dtrace-provider build
# - Frozen lockfile for consistency
RUN bun install --frozen-lockfile --ignore-scripts

# Manually run only the necessary Prisma generation
# Use the DATABASE_URL passed as build argument
RUN bunx prisma generate --schema=./src/prisma/schema.prisma

# Copy the rest of the source code
COPY backend ./

# Expose port
EXPOSE 8000
ENV PORT=8000

# Start the backend in production
CMD ["bun", "run", "start:prod"]
