#!/usr/bin/env bash
# Automated deployment script for Ubuntu/Debian Linux VPS
set -e

echo "🚀 Starting VoteVision AI Deployment..."

APP_DIR="/var/www/DIGI-VOTER"
LOG_DIR="/var/log/votevision"

# Ensure directories exist
sudo mkdir -p "$LOG_DIR"
sudo chown -R ubuntu:www-data "$LOG_DIR"

cd "$APP_DIR"

echo "📥 Pulling latest codebase..."
git pull origin main

echo "🐍 Updating Python virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip
pip install -r Backend/requirements.txt

echo "🧪 Running automated tests before restart..."
python -m pytest Backend/tests/ -v

echo "🔄 Restarting VoteVision AI service..."
sudo systemctl daemon-reload
sudo systemctl restart votevision.service
sudo systemctl status votevision.service --no-pager

echo "🌐 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
