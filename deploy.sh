#!/bin/bash
set -e

echo "==> Git pull..."
git pull

echo "==> Frontend build..."
cd frontend
npm install --silent
npm run build
cd ..

echo "==> Backend rebuild..."
docker compose up -d --build backend

echo "==> Nginx reload..."
sudo nginx -s reload

echo "✓ Deploy tugadi!"
