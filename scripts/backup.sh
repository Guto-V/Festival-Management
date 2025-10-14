#!/bin/bash

# Festival Management System Backup Script
# Creates backups of database and uploads

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "🗄️ Starting backup process"

# Backup database
if [[ -f "backend/festival.db" ]]; then
    log "Backing up SQLite database..."
    cp "backend/festival.db" "$BACKUP_DIR/festival_${TIMESTAMP}.db"
    success "Database backed up to: $BACKUP_DIR/festival_${TIMESTAMP}.db"
else
    warn "No local database found (may be using external database)"
fi

# Backup uploads directory
if [[ -d "uploads" ]]; then
    log "Backing up uploads directory..."
    tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" uploads/
    success "Uploads backed up to: $BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
else
    log "No uploads directory found"
fi

# Backup configuration
if [[ -f ".env" ]]; then
    log "Backing up environment configuration..."
    cp ".env" "$BACKUP_DIR/env_${TIMESTAMP}.backup"
    success "Environment backed up to: $BACKUP_DIR/env_${TIMESTAMP}.backup"
fi

# Create backup manifest
cat > "$BACKUP_DIR/backup_${TIMESTAMP}.manifest" << EOF
Festival Management System Backup
Created: $(date)
Timestamp: $TIMESTAMP

Files in this backup:
$(ls -la "$BACKUP_DIR" | grep "$TIMESTAMP")

System Information:
- Node.js: $(node --version 2>/dev/null || echo "Not available")
- OS: $(uname -s)
- Hostname: $(hostname)
- Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Not in git repository")
EOF

success "Backup manifest created: $BACKUP_DIR/backup_${TIMESTAMP}.manifest"

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Show backup summary
log "Backup Summary:"
echo "  Directory: $BACKUP_DIR"
echo "  Timestamp: $TIMESTAMP"
echo "  Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo "  Files: $(ls -1 "$BACKUP_DIR" | grep "$TIMESTAMP" | wc -l)"

success "Backup completed successfully!"

# Optional: Upload to cloud storage
if [[ -n "$AWS_S3_BUCKET" ]]; then
    log "Uploading backup to S3..."
    aws s3 sync "$BACKUP_DIR" "s3://$AWS_S3_BUCKET/backups/" --exclude "*" --include "*$TIMESTAMP*"
    success "Backup uploaded to S3"
fi