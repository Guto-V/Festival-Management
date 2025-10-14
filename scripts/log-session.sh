#!/bin/bash

# Quick session logging script
# Usage: ./scripts/log-session.sh "Your message here"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
MESSAGE="$1"

if [ -z "$MESSAGE" ]; then
    echo "Usage: $0 \"Your log message\""
    exit 1
fi

echo "" >> SESSION_LOG.md
echo "### $TIMESTAMP" >> SESSION_LOG.md
echo "- $MESSAGE" >> SESSION_LOG.md

echo "✅ Logged: $MESSAGE"