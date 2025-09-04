#!/bin/bash

# Auto-sync daemon - Watches for file changes and auto-pushes to GitHub
# Enables true automatic sync: Local → GitHub → Netlify

REPO_DIR="/Users/Danallovertheplace/crypto-campaign-unified"
LOCK_FILE="$REPO_DIR/.auto-sync.lock"
LOG_FILE="$REPO_DIR/.auto-sync.log"
LAST_PUSH_FILE="$REPO_DIR/.last-push"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_FILE"
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

# Prevent multiple instances
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        log "Auto-sync daemon already running (PID: $PID)"
        exit 0
    else
        rm -f "$LOCK_FILE"
    fi
fi

echo $$ > "$LOCK_FILE"
log "🚀 Auto-sync daemon started"

# Change to repo directory
cd "$REPO_DIR" || exit 1

# Auto-push function
auto_push() {
    log "📁 Checking for changes to push..."
    
    # Check if there are unstaged changes
    if ! git diff --quiet || ! git diff --staged --quiet; then
        log "💾 Auto-staging changes..."
        git add -A
        
        # Generate commit message
        COMMIT_MSG="Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
        
        log "📝 Auto-committing: $COMMIT_MSG"
        git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1
    fi
    
    # Check if there are unpushed commits
    BRANCH=$(git branch --show-current)
    if ! git rev-list --count origin/"$BRANCH".."$BRANCH" 2>/dev/null | grep -q '^0$'; then
        log "📤 Auto-pushing to GitHub..."
        
        # Pull first to avoid conflicts
        git pull --rebase origin "$BRANCH" >> "$LOG_FILE" 2>&1 || true
        
        # Push
        if git push origin "$BRANCH" >> "$LOG_FILE" 2>&1; then
            log "✅ Successfully auto-pushed to GitHub"
            echo "$(date +%s)" > "$LAST_PUSH_FILE"
            
            # GitHub → Netlify is automatic via netlify.toml
            log "🌐 Netlify deployment triggered automatically"
        else
            log "⚠️ Auto-push failed - will retry"
        fi
    else
        log "✓ Repository is up-to-date"
    fi
}

# Cleanup function
cleanup() {
    log "🛑 Auto-sync daemon stopping..."
    rm -f "$LOCK_FILE"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main daemon loop
log "👀 Watching for file changes..."
log "📂 Directory: $REPO_DIR"
log "🔄 Auto-push interval: 5 minutes"

COUNTER=0
while true; do
    # Auto-push every 5 minutes (300 seconds / 30 = 10 iterations)
    if [ $((COUNTER % 10)) -eq 0 ]; then
        auto_push
    fi
    
    # Sleep and increment
    sleep 30
    COUNTER=$((COUNTER + 1))
    
    # Reset counter to prevent overflow
    if [ $COUNTER -gt 1000 ]; then
        COUNTER=0
    fi
done