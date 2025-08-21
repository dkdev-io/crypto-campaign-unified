#!/bin/bash

# Auto-sync SAVE script - Commit and push changes automatically
# For multi-platform development (Lovable, Replit, Local)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}    💾 SYNC SAVE - Push Changes to GitHub${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if git repo exists
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not a git repository!${NC}"
    exit 1
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${YELLOW}$BRANCH${NC}"

# Check for changes
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}ℹ️  No changes to save${NC}"
    
    # Check if there are commits to push
    if git rev-list --count origin/"$BRANCH".."$BRANCH" 2>/dev/null | grep -q '^0$'; then
        echo -e "${GREEN}✓ Everything is up-to-date${NC}"
        exit 0
    else
        echo -e "${BLUE}📤 Unpushed commits found. Pushing...${NC}"
    fi
else
    # Stage all changes
    echo -e "${BLUE}📁 Staging all changes...${NC}"
    git add -A
    
    # Show what's being committed
    echo -e "${BLUE}📋 Changes to be committed:${NC}"
    git status --short
    
    # Generate commit message
    DEFAULT_MSG="Auto-sync from $(hostname) at $(date '+%Y-%m-%d %H:%M:%S')"
    
    echo ""
    echo -e "${YELLOW}💬 Commit message:${NC}"
    echo "Press ENTER for auto-message or type custom message:"
    echo -e "${CYAN}[$DEFAULT_MSG]${NC}"
    read -r COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="$DEFAULT_MSG"
    fi
    
    # Commit changes
    echo -e "${BLUE}📝 Committing changes...${NC}"
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✓ Changes committed${NC}"
fi

# Pull before push to avoid conflicts
echo -e "${BLUE}🔄 Syncing with remote...${NC}"
if git pull --rebase origin "$BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✓ Synced with remote${NC}"
else
    echo -e "${YELLOW}⚠️  No upstream branch, will create it${NC}"
fi

# Push changes
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
if git push origin "$BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully pushed to $BRANCH${NC}"
elif git push -u origin "$BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully pushed and set upstream${NC}"
else
    echo -e "${RED}❌ Push failed!${NC}"
    echo "Possible issues:"
    echo "  1. No remote configured: git remote add origin <url>"
    echo "  2. Authentication needed: check your GitHub credentials"
    echo "  3. Conflicts exist: run ./sync-fix.sh"
    exit 1
fi

# Show final status
echo ""
echo -e "${BLUE}📊 Final Status:${NC}"
git log --oneline -n 3
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Changes saved to GitHub successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Platform sync status:"
echo "  • ${GREEN}GitHub${NC}: Updated ✓"
echo "  • ${CYAN}Lovable${NC}: Will pull automatically"
echo "  • ${CYAN}Replit${NC}: Will pull on next session"