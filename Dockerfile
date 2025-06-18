# Quantum Media Hub - Ultimate Sovereign Streaming Platform
# Multi-stage Docker build for production deployment

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json frontend/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN yarn build

# Stage 2: Setup Backend Dependencies
FROM python:3.11-slim AS backend-deps

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ffmpeg-dev \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    pkg-config \
    gcc \
    g++ \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install emergentintegrations with special index
RUN pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Stage 3: Final Production Image
FROM python:3.11-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ffprobe \
    nginx \
    supervisor \
    mongodb-clients \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 app && mkdir -p /app && chown app:app /app

WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=backend-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy backend source
COPY backend/ ./backend/

# Copy configuration files
COPY docker/ ./docker/

# Create necessary directories
RUN mkdir -p /app/sovereign_storage/{streams,thumbnails,content,metadata,cache,uploads,live,users} \
    && mkdir -p /var/log/supervisor \
    && chown -R app:app /app \
    && chown -R app:app /var/log/supervisor

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/sites-available/default

# Expose ports
EXPOSE 80 443 8001 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV PYTHONPATH=/app/backend
ENV MONGO_URL=mongodb://mongo:27017
ENV DB_NAME=quantum_media_hub

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]