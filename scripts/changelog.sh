#!/bin/bash

# Automatic Changelog Generator
# Creates detailed changelogs from git history with feature categorization

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}    📝 CHANGELOG GENERATOR - Auto Documentation${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository!${NC}"
    exit 1
fi

# Function to categorize commits based on conventional commit format
categorize_commit() {
    local commit_msg="$1"
    local hash="$2"
    local date="$3"
    
    # Extract type from conventional commit format (type: description)
    if [[ $commit_msg =~ ^([a-z]+)(\(.+\))?:\ (.+) ]]; then
        local type="${BASH_REMATCH[1]}"
        local scope="${BASH_REMATCH[2]}"
        local description="${BASH_REMATCH[3]}"
    else
        # Fallback: categorize by keywords
        case $commit_msg in
            *"fix"*|*"bug"*|*"error"*) type="fix" ;;
            *"feat"*|*"feature"*|*"add"*) type="feat" ;;
            *"docs"*|*"readme"*|*"documentation"*) type="docs" ;;
            *"style"*|*"format"*|*"ui"*) type="style" ;;
            *"refactor"*|*"cleanup"*|*"optimize"*) type="refactor" ;;
            *"test"*|*"spec"*) type="test" ;;
            *"chore"*|*"update"*|*"bump"*) type="chore" ;;
            *"perf"*|*"performance"*) type="perf" ;;
            *"ci"*|*"build"*|*"deploy"*) type="ci" ;;
            *"breaking"*|*"BREAKING"*) type="breaking" ;;
            *) type="misc" ;;
        esac
        description="$commit_msg"
    fi
    
    # Remove emoji and clean up
    description=$(echo "$description" | sed 's/^[[:space:]]*[🎉🔧📝✨🐛🚀📦⚡🔥💡🎨🚑🔒🌟📈🔀💥🎯🛠️🎪🔖📚⭐]*[[:space:]]*//')
    
    echo "$type|$description|$hash|$date"
}

# Function to get commits between two points
get_commits() {
    local from="$1"
    local to="${2:-HEAD}"
    
    if [ -z "$from" ]; then
        # No from point, get recent commits
        git log --oneline --pretty=format:"%H|%s|%cd" --date=short -n 50 "$to"
    else
        # Get commits between from and to
        git log --oneline --pretty=format:"%H|%s|%cd" --date=short "$from..$to"
    fi
}

# Function to generate markdown changelog section
generate_section() {
    local version="$1"
    local date="$2"
    local commits="$3"
    
    echo "## [$version] - $date"
    echo ""
    
    # Initialize category arrays
    declare -A categories
    categories["feat"]="### ✨ New Features"
    categories["fix"]="### 🐛 Bug Fixes"
    categories["docs"]="### 📚 Documentation"
    categories["style"]="### 🎨 Styling"
    categories["refactor"]="### ♻️ Code Refactoring"
    categories["perf"]="### ⚡ Performance Improvements"
    categories["test"]="### 🧪 Tests"
    categories["ci"]="### 👷 CI/CD"
    categories["chore"]="### 🔧 Maintenance"
    categories["breaking"]="### 💥 Breaking Changes"
    categories["misc"]="### 📋 Other Changes"
    
    # Group commits by category
    declare -A commit_groups
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            IFS='|' read -r hash msg date <<< "$line"
            categorized=$(categorize_commit "$msg" "$hash" "$date")
            IFS='|' read -r type desc commit_hash commit_date <<< "$categorized"
            
            if [ -z "${commit_groups[$type]}" ]; then
                commit_groups[$type]="- $desc ([$(echo $commit_hash | cut -c1-7)]($REPO_URL/commit/$commit_hash))"
            else
                commit_groups[$type]+=$'\n'"- $desc ([$(echo $commit_hash | cut -c1-7)]($REPO_URL/commit/$commit_hash))"
            fi
        fi
    done <<< "$commits"
    
    # Output sections in order
    for category in "breaking" "feat" "fix" "perf" "refactor" "style" "docs" "test" "ci" "chore" "misc"; do
        if [ -n "${commit_groups[$category]}" ]; then
            echo "${categories[$category]}"
            echo ""
            echo "${commit_groups[$category]}"
            echo ""
        fi
    done
}

# Get repository URL for commit links
REPO_URL=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unreleased")

# Get command line arguments
MODE="${1:-auto}"

case $MODE in
    auto)
        echo -e "${BLUE}🔄 Generating automatic changelog...${NC}"
        
        # Get the last tag
        LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
        
        if [ -z "$LAST_TAG" ]; then
            echo -e "${YELLOW}ℹ️  No previous tags found. Generating full history.${NC}"
            COMMITS=$(get_commits "")
            FROM_VERSION="Initial"
        else
            echo -e "${BLUE}📍 Last tag: ${YELLOW}$LAST_TAG${NC}"
            COMMITS=$(get_commits "$LAST_TAG")
            FROM_VERSION="$LAST_TAG"
        fi
        
        if [ -z "$COMMITS" ]; then
            echo -e "${YELLOW}ℹ️  No new commits since last release.${NC}"
            exit 0
        fi
        
        # Generate changelog section
        TODAY=$(date '+%Y-%m-%d')
        NEW_SECTION=$(generate_section "v$CURRENT_VERSION" "$TODAY" "$COMMITS")
        
        # Update or create CHANGELOG.md
        if [ -f "CHANGELOG.md" ]; then
            # Insert new section after the header
            {
                head -n 3 CHANGELOG.md 2>/dev/null || echo -e "# Changelog\n\nAll notable changes to this project will be documented in this file.\n"
                echo "$NEW_SECTION"
                tail -n +4 CHANGELOG.md 2>/dev/null || true
            } > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md
        else
            # Create new changelog
            cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project will be documented in this file.

$NEW_SECTION
EOF
        fi
        
        echo -e "${GREEN}✓ Changelog updated for v$CURRENT_VERSION${NC}"
        ;;
        
    full)
        echo -e "${BLUE}🔄 Generating full changelog...${NC}"
        
        # Get all tags in chronological order
        TAGS=$(git tag -l --sort=-version:refname | grep -E '^v[0-9]' | head -20)
        
        # Create new changelog
        cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

EOF
        
        PREVIOUS_TAG=""
        for TAG in $TAGS; do
            TAG_DATE=$(git log -1 --format=%ai "$TAG" | cut -d' ' -f1)
            
            if [ -z "$PREVIOUS_TAG" ]; then
                # Most recent tag - compare with HEAD
                COMMITS=$(get_commits "$TAG" "HEAD")
                if [ -n "$COMMITS" ]; then
                    UNRELEASED_SECTION=$(generate_section "Unreleased" "$(date '+%Y-%m-%d')" "$COMMITS")
                    echo "$UNRELEASED_SECTION" >> CHANGELOG.md
                fi
                COMMITS=$(get_commits "" "$TAG")
            else
                COMMITS=$(get_commits "$TAG" "$PREVIOUS_TAG")
            fi
            
            if [ -n "$COMMITS" ]; then
                VERSION_SECTION=$(generate_section "${TAG#v}" "$TAG_DATE" "$COMMITS")
                echo "$VERSION_SECTION" >> CHANGELOG.md
            fi
            
            PREVIOUS_TAG="$TAG"
        done
        
        echo -e "${GREEN}✓ Full changelog generated${NC}"
        ;;
        
    custom)
        echo -e "${CYAN}✨ Custom Changelog Mode${NC}"
        echo ""
        read -p "Enter version to generate changelog for: " VERSION
        read -p "Enter start reference (tag/commit/leave empty for full): " START_REF
        read -p "Enter end reference (tag/commit/leave empty for HEAD): " END_REF
        
        END_REF=${END_REF:-HEAD}
        
        if [ -n "$START_REF" ]; then
            COMMITS=$(get_commits "$START_REF" "$END_REF")
        else
            COMMITS=$(get_commits "")
        fi
        
        if [ -z "$COMMITS" ]; then
            echo -e "${YELLOW}ℹ️  No commits found in range.${NC}"
            exit 0
        fi
        
        TODAY=$(date '+%Y-%m-%d')
        CUSTOM_SECTION=$(generate_section "$VERSION" "$TODAY" "$COMMITS")
        
        echo ""
        echo -e "${BLUE}📝 Generated section:${NC}"
        echo "=================================="
        echo "$CUSTOM_SECTION"
        echo "=================================="
        echo ""
        
        read -p "Add this to CHANGELOG.md? (y/n): " confirm
        if [[ $confirm == "y" || $confirm == "Y" ]]; then
            if [ -f "CHANGELOG.md" ]; then
                {
                    head -n 3 CHANGELOG.md
                    echo "$CUSTOM_SECTION"
                    tail -n +4 CHANGELOG.md
                } > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md
            else
                cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project will be documented in this file.

$CUSTOM_SECTION
EOF
            fi
            echo -e "${GREEN}✓ Custom changelog section added${NC}"
        fi
        ;;
        
    help|*)
        echo "Changelog Generator Usage:"
        echo ""
        echo "  ./scripts/changelog.sh auto     - Generate changelog for unreleased changes"
        echo "  ./scripts/changelog.sh full     - Regenerate complete changelog from all tags"
        echo "  ./scripts/changelog.sh custom   - Interactive custom changelog generation"
        echo ""
        echo "NPM shortcut:"
        echo "  npm run changelog"
        echo ""
        echo "Features:"
        echo "  • Automatic commit categorization (feat, fix, docs, etc.)"
        echo "  • Conventional commit format support"
        echo "  • GitHub commit links"
        echo "  • Semantic versioning compliance"
        echo "  • Markdown formatting"
        exit 0
        ;;
esac

# Show file location and preview
if [ -f "CHANGELOG.md" ]; then
    echo ""
    echo -e "${BLUE}📄 Changelog location: ${CYAN}CHANGELOG.md${NC}"
    echo -e "${BLUE}📊 Preview (first 20 lines):${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    head -n 20 CHANGELOG.md
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${YELLOW}💡 Tip: Review and edit CHANGELOG.md before committing${NC}"
fi