#!/bin/bash

# Festival Management System Deployment Script
# Supports both development and production deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="festival-management"
HEALTH_ENDPOINT="/api/health"
MAX_HEALTH_CHECKS=30
HEALTH_CHECK_INTERVAL=2

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Check if required environment variables are set for production
check_production_env() {
    local required_vars=("JWT_SECRET" "DATABASE_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing required environment variables for production:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
}

# Health check function
wait_for_health() {
    local url="$1"
    local count=0
    
    log "Waiting for application to be healthy at $url"
    
    while [[ $count -lt $MAX_HEALTH_CHECKS ]]; do
        if curl -f "$url" > /dev/null 2>&1; then
            success "Application is healthy!"
            return 0
        fi
        
        count=$((count + 1))
        log "Health check $count/$MAX_HEALTH_CHECKS failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    error "Application failed to become healthy after $MAX_HEALTH_CHECKS attempts"
    return 1
}

# Development deployment
deploy_development() {
    log "🔧 Starting development deployment"
    
    # Install backend dependencies
    log "Installing backend dependencies..."
    cd backend && npm install
    
    # Install frontend dependencies
    log "Installing frontend dependencies..."
    cd ../frontend && npm install
    
    # Start development servers
    log "Starting development servers..."
    
    # Start backend in background
    cd ../backend
    npm run dev > ../logs/backend-dev.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend in background
    cd ../frontend
    npm start > ../logs/frontend-dev.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    
    # Wait for health check
    if wait_for_health "http://localhost:3001$HEALTH_ENDPOINT"; then
        success "Development environment is running!"
        log "Backend: http://localhost:3001"
        log "Frontend: http://localhost:3000"
        log "Health: http://localhost:3001/api/health"
        log "Logs: tail -f logs/backend-dev.log logs/frontend-dev.log"
    else
        error "Development deployment failed"
        exit 1
    fi
}

# Production deployment
deploy_production() {
    log "🚀 Starting production deployment"
    
    # Validate environment
    check_production_env
    
    # Create necessary directories
    mkdir -p logs data uploads
    
    # Build frontend
    log "Building frontend for production..."
    cd frontend
    npm ci --only=production
    npm run build
    
    # Install backend dependencies
    log "Installing backend dependencies..."
    cd ../backend
    npm ci --only=production
    
    # Run database migrations if they exist
    if [[ -f "scripts/migrate.js" ]]; then
        log "Running database migrations..."
        node scripts/migrate.js
    fi
    
    # Stop existing application
    if [[ -f "../logs/app.pid" ]]; then
        log "Stopping existing application..."
        kill $(cat ../logs/app.pid) 2>/dev/null || true
        rm -f ../logs/app.pid
    fi
    
    # Start production server
    log "Starting production server..."
    NODE_ENV=production node src/index.js > ../logs/app.log 2>&1 &
    APP_PID=$!
    echo $APP_PID > ../logs/app.pid
    
    # Wait for health check
    local port=${PORT:-3001}
    if wait_for_health "http://localhost:$port$HEALTH_ENDPOINT"; then
        success "Production deployment successful!"
        log "Application: http://localhost:$port"
        log "Health: http://localhost:$port/api/health"
        log "Logs: tail -f logs/app.log"
        log "PID: $APP_PID"
    else
        error "Production deployment failed"
        exit 1
    fi
}

# Docker deployment
deploy_docker() {
    log "🐳 Starting Docker deployment"
    
    # Build and start with docker-compose
    log "Building Docker images..."
    docker-compose build
    
    log "Starting containers..."
    docker-compose up -d
    
    # Wait for health check
    local port=${PORT:-3001}
    if wait_for_health "http://localhost:$port$HEALTH_ENDPOINT"; then
        success "Docker deployment successful!"
        log "Application: http://localhost:$port"
        log "Health: http://localhost:$port/api/health"
        log "Logs: docker-compose logs -f"
        log "Status: docker-compose ps"
    else
        error "Docker deployment failed"
        docker-compose logs
        exit 1
    fi
}

# Stop function
stop_application() {
    log "Stopping Festival Management System..."
    
    # Stop Docker containers
    if [[ -f "docker-compose.yml" ]]; then
        docker-compose down
    fi
    
    # Stop development processes
    if [[ -f "logs/backend.pid" ]]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm -f logs/backend.pid
    fi
    
    if [[ -f "logs/frontend.pid" ]]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    
    # Stop production process
    if [[ -f "logs/app.pid" ]]; then
        kill $(cat logs/app.pid) 2>/dev/null || true
        rm -f logs/app.pid
    fi
    
    success "Application stopped"
}

# Show status
show_status() {
    log "Festival Management System Status"
    
    # Check Docker
    if docker-compose ps | grep -q "Up"; then
        success "Docker containers are running"
        docker-compose ps
    fi
    
    # Check processes
    if [[ -f "logs/app.pid" ]] && kill -0 $(cat logs/app.pid) 2>/dev/null; then
        success "Production process is running (PID: $(cat logs/app.pid))"
    fi
    
    if [[ -f "logs/backend.pid" ]] && kill -0 $(cat logs/backend.pid) 2>/dev/null; then
        success "Development backend is running (PID: $(cat logs/backend.pid))"
    fi
    
    if [[ -f "logs/frontend.pid" ]] && kill -0 $(cat logs/frontend.pid) 2>/dev/null; then
        success "Development frontend is running (PID: $(cat logs/frontend.pid))"
    fi
}

# Main script logic
case "$1" in
    "development" | "dev")
        deploy_development
        ;;
    "production" | "prod")
        deploy_production
        ;;
    "docker")
        deploy_docker
        ;;
    "stop")
        stop_application
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 {development|production|docker|stop|status}"
        echo ""
        echo "Commands:"
        echo "  development  - Start development servers"
        echo "  production   - Deploy to production"
        echo "  docker      - Deploy using Docker"
        echo "  stop        - Stop all running processes"
        echo "  status      - Show application status"
        echo ""
        echo "Environment Variables (for production):"
        echo "  JWT_SECRET     - JWT signing secret"
        echo "  DATABASE_URL   - Database connection string"
        echo "  CORS_ORIGIN    - Allowed CORS origin"
        echo "  PORT          - Server port (default: 3001)"
        exit 1
        ;;
esac