# Festival Management System - Deployment Guide

This guide covers deploying the Festival Management System for both development and production environments.

## 🚀 Quick Start

### Development
```bash
# Clone and setup
git clone <repository-url>
cd Festival-Management

# Start development environment
./scripts/deploy.sh development

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Health: http://localhost:3001/api/health
```

### Production
```bash
# Set environment variables
export JWT_SECRET="your-super-secret-key"
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export CORS_ORIGIN="https://your-domain.com"

# Deploy to production
./scripts/deploy.sh production
```

### Docker
```bash
# Quick Docker deployment
./scripts/deploy.sh docker

# Or manually with docker-compose
docker-compose up -d
```

## 📋 Prerequisites

### Development
- Node.js 18+
- npm or yarn
- Git

### Production
- Node.js 18+
- PostgreSQL 15+ (recommended)
- Reverse proxy (Nginx/Apache)
- SSL certificate
- Domain name

### Optional
- Docker & Docker Compose
- AWS account (for S3 storage/backups)
- Email service (SendGrid, AWS SES)

## 🔧 Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Variables

#### Development
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=sqlite:./festival.db
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:3000
```

#### Production
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/festival_management
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
CORS_ORIGIN=https://your-domain.com
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
```

## 🗄️ Database Setup

### SQLite (Development)
- Automatically created on first run
- File stored at `./festival.db`
- No additional setup required

### PostgreSQL (Production)
```sql
-- Create database and user
CREATE DATABASE festival_management;
CREATE USER festival_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE festival_management TO festival_user;
```

## 🐳 Docker Deployment

### Basic Docker Setup
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Docker Setup
```bash
# Create production override
cp docker-compose.yml docker-compose.prod.yml

# Edit docker-compose.prod.yml for production settings
# Then run:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🌐 Web Server Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Frontend (React app)
    location / {
        try_files $uri $uri/ /index.html;
        root /path/to/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:3001;
        access_log off;
    }
}
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Liveness**: `GET /api/health/live` - Basic server status
- **Readiness**: `GET /api/health/ready` - Dependencies check
- **Detailed**: `GET /api/health` - Full health report

### Monitoring Setup
```bash
# Check application status
./scripts/deploy.sh status

# View logs
tail -f logs/app.log

# Check health
curl http://localhost:3001/api/health
```

## 🔄 CI/CD Pipeline

### GitHub Actions
The repository includes automated CI/CD:

- **Testing**: Runs on every push/PR
- **Building**: Creates Docker images
- **Deployment**: Deploys to staging/production
- **Security**: Vulnerability scanning
- **Backups**: Automated daily backups

### Manual Deployment
```bash
# Test before deployment
npm run test

# Build production assets
npm run build

# Deploy
./scripts/deploy.sh production
```

## 💾 Backup & Recovery

### Automated Backups
```bash
# Run backup
./scripts/backup.sh

# Backups stored in ./backups/
# Includes: database, uploads, configuration
```

### Manual Backup
```bash
# Database backup
cp backend/festival.db backups/festival_$(date +%Y%m%d).db

# Full backup with compression
tar -czf backup_$(date +%Y%m%d).tar.gz \
    backend/festival.db \
    uploads/ \
    .env
```

### Recovery
```bash
# Restore database
cp backups/festival_20240101.db backend/festival.db

# Restore uploads
tar -xzf backups/uploads_20240101.tar.gz
```

## 🔐 Security Checklist

### Production Security
- [ ] Change default JWT secret
- [ ] Use HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] File upload restrictions
- [ ] Input validation

### Environment Variables
```bash
# Required for production
JWT_SECRET=your-unique-secret
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://your-domain.com

# Optional but recommended
EMAIL_API_KEY=your-email-key
AWS_ACCESS_KEY_ID=your-aws-key
LOG_LEVEL=warn
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Or use different port
export PORT=3002
```

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U festival_user -d festival_management
```

#### Health Check Failing
```bash
# Check logs
docker-compose logs festival-app

# Manual health check
curl -v http://localhost:3001/api/health
```

### Performance Issues
- Check memory usage: `docker stats`
- Monitor logs: `tail -f logs/app.log`
- Database queries: Enable query logging
- Network: Check proxy configuration

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.prod.yml
services:
  festival-app:
    deploy:
      replicas: 3
    
  nginx:
    image: nginx:alpine
    # Load balancer configuration
```

### Database Scaling
- Read replicas for PostgreSQL
- Connection pooling
- Query optimization
- Caching layer (Redis)

## 🛠️ Maintenance

### Regular Tasks
- **Daily**: Check health endpoints
- **Weekly**: Review logs and metrics
- **Monthly**: Security updates
- **Quarterly**: Performance review

### Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Redeploy
./scripts/deploy.sh production
```

## 📞 Support

### Logs Location
- Development: `logs/backend-dev.log`, `logs/frontend-dev.log`
- Production: `logs/app.log`
- Docker: `docker-compose logs`

### Health Check URLs
- http://localhost:3001/api/health
- http://localhost:3001/api/health/live
- http://localhost:3001/api/health/ready

### Configuration Validation
The system validates configuration on startup and logs any issues.