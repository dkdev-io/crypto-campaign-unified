#!/bin/bash

# Stop auto-sync daemon

REPO_DIR="/Users/Danallovertheplace/crypto-campaign-unified"
LOCK_FILE="$REPO_DIR/.auto-sync.lock"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping Auto-Sync Daemon...${NC}"

if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Killing process $PID...${NC}"
        kill "$PID"
        
        # Wait for process to stop
        sleep 2
        
        if ! ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Auto-sync daemon stopped successfully${NC}"
            rm -f "$LOCK_FILE"
        else
            echo -e "${RED}⚠️ Process didn't stop gracefully, force killing...${NC}"
            kill -9 "$PID"
            rm -f "$LOCK_FILE"
            echo -e "${GREEN}✅ Auto-sync daemon force stopped${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Process not running, cleaning up lock file...${NC}"
        rm -f "$LOCK_FILE"
    fi
else
    echo -e "${GREEN}✅ Auto-sync daemon is not running${NC}"
fi