#!/bin/bash
set -e

# ============================================
# MEBEL MS - Full Server Setup Script
# For NEW servers only!
# Domain: m-house.uz
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="m-house.uz"
EMAIL="isroilrakhimov2@gmail.com"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================
echo ""
echo "============================================"
echo -e "${BLUE}MEBEL MS - FULL SERVER SETUP${NC}"
echo "============================================"
echo ""
echo -e "${YELLOW}DIQQAT: Bu yangi server uchun!${NC}"
echo "Mavjud serverda ishlatmang!"
echo ""
read -p "Davom etishni xohlaysizmi? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Bekor qilindi"
    exit 0
fi

# ============================================
# 1. Check docker-compose.yml exists
# ============================================
if [ ! -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    log_error "docker-compose.yml topilmadi! Repo to'liq clone qilinganmi?"
fi
log_success "docker-compose.yml mavjud"

# ============================================
# 2. Install dependencies
# ============================================
log_info "Installing dependencies..."

apt-get update

# Docker
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    apt-get install -y curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/$(lsb_release -si | tr '[:upper:]' '[:lower:]')/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$(lsb_release -si | tr '[:upper:]' '[:lower:]') $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    systemctl start docker
    systemctl enable docker
fi

# Docker Compose
if ! docker compose version &> /dev/null; then
    log_info "Installing Docker Compose..."
    apt-get install -y docker-compose-plugin || apt-get install -y docker-compose
fi

# Node.js
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    log_info "Installing Nginx..."
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# Certbot
if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi

log_success "Dependencies installed"

# ============================================
# 3. Create .env file
# ============================================
log_info "Creating .env file..."

if [ -f "$SCRIPT_DIR/.env" ]; then
    log_warn ".env already exists, skipping..."
else
    cat > "$SCRIPT_DIR/.env" << 'EOF'
# Database
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT (change in production!)
JWT_SECRET=2lVo5TcjgTco3dUIwmYEIWcLfeiBR7QgjS9fFyn1Jdg
ACCESS_TOKEN_EXP=3600000
REFRESH_TOKEN_EXP=604800000

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# App
APP_BASE_URL=https://m-house.uz
EOF
    log_success ".env created"
    echo ""
    echo -e "${YELLOW}MUHIM: .env faylidagi parollarni o'zgartiring!${NC}"
    echo "  nano $SCRIPT_DIR/.env"
    echo ""
    read -p "O'zgartirib bo'ldingizmi? (y/N): " envconfirm
fi

# ============================================
# 4. Create directories
# ============================================
log_info "Creating directories..."
mkdir -p /var/www/certbot
mkdir -p /opt/mebel-ms/frontend
log_success "Directories created"

# ============================================
# 5. Setup Nginx (HTTP only first for SSL)
# ============================================
log_info "Setting up Nginx (HTTP)..."

cat > /etc/nginx/sites-available/mebel << 'EOF'
server {
    listen 80;
    server_name m-house.uz www.m-house.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Mebel MS - SSL setup in progress';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/mebel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

log_success "Nginx HTTP ready"

# ============================================
# 6. Get SSL certificate
# ============================================
log_info "Getting SSL certificate..."

if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_success "SSL certificate already exists"
else
    certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    if [ $? -ne 0 ]; then
        log_error "Failed to get SSL certificate!"
    fi
    log_success "SSL certificate obtained"
fi

# ============================================
# 7. Setup Nginx with SSL
# ============================================
log_info "Setting up Nginx with SSL..."

cat > /etc/nginx/sites-available/mebel << 'EOF'
server {
    listen 80;
    server_name m-house.uz www.m-house.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name m-house.uz www.m-house.uz;

    ssl_certificate /etc/letsencrypt/live/m-house.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/m-house.uz/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    root /opt/mebel-ms/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:9060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
EOF

nginx -t && systemctl reload nginx
log_success "Nginx SSL configured"

# ============================================
# 8. Build frontend
# ============================================
log_info "Building frontend..."

cd "$SCRIPT_DIR/frontend"
npm install
npm run build

cp -r "$SCRIPT_DIR/frontend/dist" /opt/mebel-ms/frontend/
log_success "Frontend built"

# ============================================
# 9. Start Docker services (using existing docker-compose.yml)
# ============================================
log_info "Starting Docker services..."

cd "$SCRIPT_DIR"
docker compose up -d

log_info "Waiting for services to start..."
sleep 30

if docker ps | grep -q mebel_backend; then
    log_success "Backend is running"
else
    log_warn "Backend may still be starting..."
    echo "Check logs: docker logs mebel_backend"
fi

# ============================================
# 10. Setup SSL auto-renewal
# ============================================
log_info "Setting up SSL auto-renewal..."

(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet && nginx -s reload") | crontab -

log_success "SSL auto-renewal configured"

# ============================================
# DONE
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}SETUP COMPLETE!${NC}"
echo "============================================"
echo ""
echo -e "URL: ${BLUE}https://$DOMAIN${NC}"
echo ""
echo "Services:"
docker compose ps
echo ""
echo "Commands:"
echo "  Logs:     docker logs -f mebel_backend"
echo "  Restart:  docker compose restart"
echo "  Update:   ./deploy.sh"
echo ""
