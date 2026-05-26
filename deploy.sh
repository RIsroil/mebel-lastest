#!/bin/bash
set -e

# ============================================
# MEBEL MS - Deploy Script
# For existing servers: ./deploy.sh
# For new servers: ./setup.sh
# ============================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[MEBEL MS]${NC} Deploying..."

echo "==> Git pull..."
git pull --rebase

echo "==> Frontend build..."
cd frontend
npm install --silent
npm run build
cd ..

echo "==> Backend rebuild..."
docker compose up -d --build backend

echo "==> Nginx reload..."
sudo nginx -s reload

echo -e "${GREEN}[OK]${NC} Deploy tugadi!"
