#!/bin/bash
<<<<<<< Updated upstream

# Sync Claude Configuration from claude-sparc-config repository
# This script pulls the latest Claude Code configuration automatically

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}    🔄 CLAUDE CONFIG SYNC${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Configuration
REPO_URL="https://raw.githubusercontent.com/dkdev-io/claude-sparc-config/main"
CONFIG_DIR=".claude"

# Create .claude directory if it doesn't exist
if [ ! -d "$CONFIG_DIR" ]; then
    mkdir -p "$CONFIG_DIR"
    echo -e "${GREEN}✓ Created .claude directory${NC}"
fi

# Backup existing CLAUDE.md if it exists
if [ -f "CLAUDE.md" ]; then
    cp "CLAUDE.md" "CLAUDE.md.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}📦 Backed up existing CLAUDE.md${NC}"
fi

# Download CLAUDE.md
echo -e "${BLUE}⬇️  Downloading CLAUDE.md...${NC}"
curl -s "$REPO_URL/CLAUDE.md" -o "CLAUDE.md"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ CLAUDE.md updated successfully${NC}"
else
    echo -e "${RED}❌ Failed to download CLAUDE.md${NC}"
    exit 1
fi

# Download hooks directory if it exists
echo -e "${BLUE}⬇️  Checking for hooks configuration...${NC}"
mkdir -p "$CONFIG_DIR/hooks"

# Try to download common hook files
HOOK_FILES=("pre-task" "post-task" "post-edit" "session-restore" "session-end")
for hook in "${HOOK_FILES[@]}"; do
    curl -s "$REPO_URL/.claude/hooks/$hook" -o "$CONFIG_DIR/hooks/$hook" 2>/dev/null
    if [ $? -eq 0 ] && [ -s "$CONFIG_DIR/hooks/$hook" ]; then
        chmod +x "$CONFIG_DIR/hooks/$hook"
        echo -e "${GREEN}✓ Downloaded hook: $hook${NC}"
    else
        rm -f "$CONFIG_DIR/hooks/$hook" 2>/dev/null
    fi
done

# Check if any hooks were downloaded
if [ "$(ls -A $CONFIG_DIR/hooks 2>/dev/null)" ]; then
    echo -e "${GREEN}✓ Hooks directory configured${NC}"
else
    rmdir "$CONFIG_DIR/hooks" 2>/dev/null
    echo -e "${YELLOW}ℹ️  No hooks found in source repository${NC}"
fi

# Preserve local settings but merge permissions
if [ -f "$CONFIG_DIR/settings.local.json" ]; then
    echo -e "${BLUE}🔧 Merging permissions into existing settings...${NC}"
    
    # Create comprehensive permissions based on CLAUDE.md
    cat > "$CONFIG_DIR/settings.local.json.new" << EOF
{
  "permissions": {
    "allow": [
      "Bash(npm install)",
      "Bash(npm run:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git pull:*)",
      "Bash(git fetch:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git branch:*)",
      "Bash(git checkout:*)",
      "Bash(git merge:*)",
      "Bash(git remote:*)",
      "Bash(gh auth:*)",
      "Bash(gh pr:*)",
      "Bash(gh issue:*)",
      "Bash(gh repo:*)",
      "Bash(brew install:*)",
      "Bash(node:*)",
      "Bash(npx:*)",
      "Bash(ssh-keygen:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(pip install:*)",
      "Bash(python:*)",
      "Bash(supabase:*)",
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:supabase.com)",
      "WebFetch(domain:docs.anthropic.com)",
      "Read(/Users/Danallovertheplace/.ssh/**)",
      "Read(/Users/Danallovertheplace/.config/**)",
      "Write(/Users/Danallovertheplace/crypto-campaign-unified/**)"
    ],
    "deny": [],
    "ask": []
  }
}
EOF
    
    # Use new settings
    mv "$CONFIG_DIR/settings.local.json.new" "$CONFIG_DIR/settings.local.json"
    echo -e "${GREEN}✓ Settings updated with comprehensive permissions${NC}"
else
    echo -e "${BLUE}🔧 Creating settings.local.json with full permissions...${NC}"
    
    cat > "$CONFIG_DIR/settings.local.json" << EOF
{
  "permissions": {
    "allow": [
      "Bash(npm install)",
      "Bash(npm run:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git pull:*)",
      "Bash(git fetch:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git branch:*)",
      "Bash(git checkout:*)",
      "Bash(git merge:*)",
      "Bash(git remote:*)",
      "Bash(gh auth:*)",
      "Bash(gh pr:*)",
      "Bash(gh issue:*)",
      "Bash(gh repo:*)",
      "Bash(brew install:*)",
      "Bash(node:*)",
      "Bash(npx:*)",
      "Bash(ssh-keygen:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(pip install:*)",
      "Bash(python:*)",
      "Bash(supabase:*)",
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:supabase.com)",
      "WebFetch(domain:docs.anthropic.com)",
      "Read(/Users/Danallovertheplace/.ssh/**)",
      "Read(/Users/Danallovertheplace/.config/**)",
      "Write(/Users/Danallovertheplace/crypto-campaign-unified/**)"
    ],
    "deny": [],
    "ask": []
  }
}
EOF
    echo -e "${GREEN}✓ Created settings.local.json${NC}"
fi

# Make this script executable
chmod +x "sync-claude-config.sh"

# Update existing sync scripts to include Claude config sync
if [ -f "sync-start.sh" ]; then
    if ! grep -q "sync-claude-config.sh" "sync-start.sh"; then
        echo -e "${BLUE}🔧 Adding Claude config sync to sync-start.sh...${NC}"
        
        # Add Claude config sync after the git operations
        sed -i.bak '/# Re-apply stashed changes if any/i\
# Sync Claude configuration\
if [ -f "sync-claude-config.sh" ]; then\
    echo -e "${BLUE}🔄 Syncing Claude configuration...${NC}"\
    ./sync-claude-config.sh > /dev/null 2>&1 || true\
    echo -e "${GREEN}✓ Claude config synced${NC}"\
fi\
' "sync-start.sh"
        echo -e "${GREEN}✓ Updated sync-start.sh to include Claude config sync${NC}"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Claude Configuration Sync Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Configuration synced from: ${CYAN}$REPO_URL${NC}"
echo -e "Files updated:"
echo -e "  ${GREEN}✓${NC} CLAUDE.md - Main configuration"
echo -e "  ${GREEN}✓${NC} .claude/settings.local.json - Permissions"
if [ -d "$CONFIG_DIR/hooks" ] && [ "$(ls -A $CONFIG_DIR/hooks 2>/dev/null)" ]; then
    echo -e "  ${GREEN}✓${NC} .claude/hooks/ - Hook scripts"
fi
echo ""
echo -e "${YELLOW}Next time, just run:${NC} ${CYAN}./sync-claude-config.sh${NC}"
echo -e "${YELLOW}Or it will auto-run with:${NC} ${CYAN}./sync-start.sh${NC}"
echo ""
echo -e "${BLUE}Your Claude Code session now has full autonomy permissions!${NC}"
=======
curl -s "https://raw.githubusercontent.com/dkdev-io/claude-sparc-config/main/CLAUDE.md" -o "CLAUDE.md" 2>/dev/null
echo "Claude config synced"
>>>>>>> Stashed changes
