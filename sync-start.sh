#!/bin/bash

# Auto-sync START script - Pull latest changes before working
# For multi-platform development (Lovable, Replit, Local)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    🔄 SYNC START - Multi-Platform Development${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if git repo exists
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not a git repository!${NC}"
    echo "Run: git init"
    exit 1
fi

# Stash any local changes
if ! git diff --quiet || ! git diff --staged --quiet; then
    echo -e "${YELLOW}📦 Stashing local changes...${NC}"
    git stash push -m "Auto-stash before sync $(date '+%Y-%m-%d %H:%M:%S')"
    STASHED=true
else
    echo -e "${GREEN}✓ Working directory clean${NC}"
    STASHED=false
fi

# Fetch latest from all remotes
echo -e "${BLUE}🌐 Fetching from all remotes...${NC}"
git fetch --all --prune

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${YELLOW}$BRANCH${NC}"

# Try to pull with rebase
echo -e "${BLUE}⬇️  Pulling latest changes...${NC}"
if git pull --rebase origin "$BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully pulled latest changes${NC}"
elif git pull --rebase origin main 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully pulled from main${NC}"
elif git pull --rebase origin master 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully pulled from master${NC}"
else
    echo -e "${YELLOW}⚠️  Could not pull. You might need to set upstream:${NC}"
    echo "   git branch --set-upstream-to=origin/$BRANCH"
fi

# Sync Claude configuration
if [ -f "sync-claude-config.sh" ]; then
    echo -e "${BLUE}🔄 Syncing Claude configuration...${NC}"
    ./sync-claude-config.sh > /dev/null 2>&1 || true
    echo -e "${GREEN}✓ Claude config synced${NC}"
fi
# Re-apply stashed changes if any
if [ "$STASHED" = true ]; then
    echo -e "${YELLOW}📦 Re-applying stashed changes...${NC}"
    if git stash pop; then
        echo -e "${GREEN}✓ Stashed changes re-applied${NC}"
    else
        echo -e "${RED}⚠️  Conflict while applying stash!${NC}"
        echo "Resolve conflicts then run: git stash drop"
    fi
fi

# Show current status
echo ""
echo -e "${BLUE}📊 Current Status:${NC}"
git status --short

# Check if node_modules exists, if not install
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Ready to work! Your code is up-to-date.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "When done, run: ${YELLOW}./sync-save.sh${NC} to push changes"