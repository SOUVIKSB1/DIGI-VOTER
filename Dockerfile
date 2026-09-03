# Multi-stage production Dockerfile for VoteVision AI
FROM python:3.12-slim AS base

# Install system dependencies needed for compiling ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency requirements
COPY Backend/requirements.txt ./requirements.txt

# Install Python packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend and frontend source files
COPY Backend/ ./Backend/
COPY Frontend/ ./Frontend/

# Set working directory to Backend for Flask module resolution
WORKDIR /app/Backend

# Set environment defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_ENV=production \
    PORT=5001

# Expose server port
EXPOSE 5001

# Health check to monitor container status
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5001/api/v1/health || exit 1

# Launch production WSGI Gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--threads", "4", "--timeout", "120", "app:create_app('production')"]
