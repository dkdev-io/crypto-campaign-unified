#!/bin/bash

# Start auto-sync daemon in background
# Enables automatic Local → GitHub → Netlify sync

REPO_DIR="/Users/Danallovertheplace/crypto-campaign-unified"
DAEMON_SCRIPT="$REPO_DIR/auto-sync-daemon.sh"
LOCK_FILE="$REPO_DIR/.auto-sync.lock"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Auto-Sync Daemon...${NC}"

# Check if already running
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Auto-sync daemon already running (PID: $PID)${NC}"
        echo -e "${YELLOW}💡 To stop: kill $PID${NC}"
        echo -e "${YELLOW}📄 Log file: $REPO_DIR/.auto-sync.log${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️ Cleaning up stale lock file...${NC}"
        rm -f "$LOCK_FILE"
    fi
fi

# Make daemon executable
chmod +x "$DAEMON_SCRIPT"

# Start daemon in background
echo -e "${BLUE}🔄 Launching background daemon...${NC}"
nohup "$DAEMON_SCRIPT" > /dev/null 2>&1 &
DAEMON_PID=$!

# Wait a moment to ensure it started
sleep 2

if ps -p "$DAEMON_PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auto-sync daemon started successfully!${NC}"
    echo -e "${GREEN}   PID: $DAEMON_PID${NC}"
    echo -e "${GREEN}   Log: $REPO_DIR/.auto-sync.log${NC}"
    echo ""
    echo -e "${BLUE}🎯 Automatic sync enabled:${NC}"
    echo -e "   📝 Local changes → Auto-commit every 5 minutes"
    echo -e "   📤 Auto-push → GitHub every 5 minutes"  
    echo -e "   🌐 GitHub → Netlify deployment (automatic)"
    echo ""
    echo -e "${YELLOW}💡 To stop: kill $DAEMON_PID${NC}"
    echo -e "${YELLOW}📊 To monitor: tail -f $REPO_DIR/.auto-sync.log${NC}"
else
    echo -e "${RED}❌ Failed to start auto-sync daemon${NC}"
    exit 1
fi