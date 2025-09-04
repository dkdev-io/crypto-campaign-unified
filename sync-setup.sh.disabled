#!/bin/bash

# Initial setup script for GitHub repository connection
# Run this once to connect your local repo to GitHub

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}    🚀 GITHUB SETUP - Connect Repository${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if git is initialized
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}✓ Git repository initialized${NC}"
fi

# Check for existing remote
if git remote | grep -q origin; then
    echo -e "${YELLOW}⚠️  Remote 'origin' already exists:${NC}"
    git remote -v
    echo ""
    read -p "Update remote URL? (y/n): " update
    if [[ $update != "y" && $update != "Y" ]]; then
        echo "Keeping existing remote."
        exit 0
    fi
fi

# Get GitHub repo URL
echo ""
echo -e "${BLUE}📝 Enter your GitHub repository URL:${NC}"
echo "Format: https://github.com/USERNAME/REPO-NAME.git"
echo "Or: git@github.com:USERNAME/REPO-NAME.git"
read -p "URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL cannot be empty${NC}"
    exit 1
fi

# Add/update remote
if git remote | grep -q origin; then
    git remote set-url origin "$REPO_URL"
    echo -e "${GREEN}✓ Remote URL updated${NC}"
else
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ Remote added${NC}"
fi

# Create initial commit if needed
if ! git rev-parse HEAD >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating initial commit...${NC}"
    git add .
    git commit -m "🎉 Initial commit - Crypto Campaign Setup"
    echo -e "${GREEN}✓ Initial commit created${NC}"
fi

# Set main as default branch
git branch -M main

# Try to push
echo ""
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
if git push -u origin main 2>/dev/null; then
    echo -e "${GREEN}✓ Successfully pushed to GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Push failed. Trying to sync with existing repo...${NC}"
    
    # Fetch and merge
    git fetch origin
    
    # Check if remote has commits
    if git ls-remote --heads origin main | grep -q .; then
        echo "Remote repository has existing commits."
        echo "Choose merge strategy:"
        echo "  1) Merge remote into local (recommended)"
        echo "  2) Force push local (will overwrite remote)"
        echo "  3) Cancel"
        
        read -p "Choice (1-3): " choice
        
        case $choice in
            1)
                git pull origin main --allow-unrelated-histories
                git push origin main
                echo -e "${GREEN}✓ Merged and pushed${NC}"
                ;;
            2)
                read -p "⚠️  This will DELETE remote history. Are you sure? (yes/no): " confirm
                if [ "$confirm" = "yes" ]; then
                    git push -u origin main --force
                    echo -e "${GREEN}✓ Force pushed${NC}"
                else
                    echo "Cancelled"
                    exit 0
                fi
                ;;
            *)
                echo "Cancelled"
                exit 0
                ;;
        esac
    else
        git push -u origin main
        echo -e "${GREEN}✓ Pushed to empty repository${NC}"
    fi
fi

# Make scripts executable
chmod +x sync-*.sh

# Show summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Your workflow scripts:"
echo -e "  ${CYAN}./sync-start.sh${NC} - Pull latest before working"
echo -e "  ${CYAN}./sync-save.sh${NC}  - Commit and push changes"
echo -e "  ${CYAN}./sync-fix.sh${NC}   - Fix conflicts and issues"
echo ""
echo "Repository: $REPO_URL"
echo "Branch: main"
echo ""
echo -e "${YELLOW}Recommended workflow:${NC}"
echo "1. Always run ${CYAN}./sync-start.sh${NC} before working"
echo "2. Make your changes"
echo "3. Run ${CYAN}./sync-save.sh${NC} to save to GitHub"
echo "4. If conflicts occur, use ${CYAN}./sync-fix.sh${NC}"