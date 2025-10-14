#!/bin/sh
set -e

echo "🚀 Starting Festival Management System"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Time: $(date)"

# Initialize database if it doesn't exist
if [ "$NODE_ENV" = "production" ]; then
    echo "📊 Initializing production database..."
    cd /app/backend
    # Run database migrations if they exist
    if [ -f "scripts/migrate.js" ]; then
        node scripts/migrate.js
    fi
else
    echo "🔧 Development mode - database will be initialized on first request"
fi

# Start the backend server
echo "🌟 Starting backend server..."
cd /app/backend
exec node src/index.js