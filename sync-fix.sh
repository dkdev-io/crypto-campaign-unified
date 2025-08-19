#!/bin/bash

# Conflict resolution and sync fixer script
# Handles merge conflicts from multi-platform development

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}    🔧 SYNC FIX - Resolve Conflicts${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to check for conflicts
check_conflicts() {
    if git diff --name-only --diff-filter=U | grep -q .; then
        return 0  # Conflicts exist
    else
        return 1  # No conflicts
    fi
}

# Check git status
echo -e "${BLUE}🔍 Checking repository status...${NC}"

# Check for merge conflicts
if check_conflicts; then
    echo -e "${RED}⚠️  Merge conflicts detected in:${NC}"
    git diff --name-only --diff-filter=U | while read -r file; do
        echo "   • $file"
    done
    
    echo ""
    echo -e "${YELLOW}Choose resolution strategy:${NC}"
    echo "  1) Keep LOCAL version (your changes)"
    echo "  2) Keep REMOTE version (GitHub changes)"
    echo "  3) Manual merge (open in editor)"
    echo "  4) Abort and start fresh"
    
    read -p "Choice (1-4): " choice
    
    case $choice in
        1)
            echo -e "${BLUE}Keeping local changes...${NC}"
            git status --porcelain | grep "^UU" | awk '{print $2}' | xargs git checkout --ours
            git add -A
            git commit -m "Resolved conflicts - kept local changes"
            echo -e "${GREEN}✓ Conflicts resolved with local changes${NC}"
            ;;
        2)
            echo -e "${BLUE}Keeping remote changes...${NC}"
            git status --porcelain | grep "^UU" | awk '{print $2}' | xargs git checkout --theirs
            git add -A
            git commit -m "Resolved conflicts - kept remote changes"
            echo -e "${GREEN}✓ Conflicts resolved with remote changes${NC}"
            ;;
        3)
            echo -e "${BLUE}Opening conflicts in default editor...${NC}"
            git diff --name-only --diff-filter=U | head -1 | xargs ${EDITOR:-nano}
            echo "After editing, run:"
            echo "  git add ."
            echo "  git commit -m 'Resolved conflicts manually'"
            exit 0
            ;;
        4)
            echo -e "${YELLOW}Aborting merge...${NC}"
            git merge --abort 2>/dev/null || git rebase --abort 2>/dev/null || true
            echo -e "${GREEN}✓ Merge aborted. Repository reset.${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
elif git rebase --show-current-patch 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}⚠️  Rebase in progress${NC}"
    echo ""
    echo "Options:"
    echo "  1) Continue rebase"
    echo "  2) Skip this commit"
    echo "  3) Abort rebase"
    
    read -p "Choice (1-3): " choice
    
    case $choice in
        1)
            git rebase --continue
            ;;
        2)
            git rebase --skip
            ;;
        3)
            git rebase --abort
            echo -e "${GREEN}✓ Rebase aborted${NC}"
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
else
    echo -e "${GREEN}✓ No conflicts detected${NC}"
    echo ""
    echo -e "${BLUE}🔄 Attempting full sync...${NC}"
    
    # Try to sync
    BRANCH=$(git branch --show-current)
    
    # Fetch latest
    git fetch --all
    
    # Check if behind
    BEHIND=$(git rev-list --count HEAD..origin/"$BRANCH" 2>/dev/null || echo "0")
    AHEAD=$(git rev-list --count origin/"$BRANCH"..HEAD 2>/dev/null || echo "0")
    
    if [ "$BEHIND" -gt 0 ] && [ "$AHEAD" -gt 0 ]; then
        echo -e "${YELLOW}📊 Diverged: $AHEAD ahead, $BEHIND behind${NC}"
        echo "Attempting to rebase..."
        git pull --rebase origin "$BRANCH"
    elif [ "$BEHIND" -gt 0 ]; then
        echo -e "${BLUE}⬇️  Behind by $BEHIND commits. Pulling...${NC}"
        git pull origin "$BRANCH"
    elif [ "$AHEAD" -gt 0 ]; then
        echo -e "${BLUE}⬆️  Ahead by $AHEAD commits. Pushing...${NC}"
        git push origin "$BRANCH"
    else
        echo -e "${GREEN}✓ Already up-to-date${NC}"
    fi
fi

# Final status
echo ""
echo -e "${BLUE}📊 Current status:${NC}"
git status --short

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Sync issues resolved!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"