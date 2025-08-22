#!/bin/bash

# Complete Release Workflow Manager
# Handles the full release process: version, changelog, tagging, and publishing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}    🚀 RELEASE MANAGER - Complete Workflow${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository!${NC}"
    exit 1
fi

# Check for package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found!${NC}"
    exit 1
fi

# Get current version and branch
CURRENT_VERSION=$(node -p "require('./package.json').version")
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${BLUE}📍 Current version: ${YELLOW}v$CURRENT_VERSION${NC}"
echo -e "${BLUE}📍 Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"

# Function to check if branch is clean
check_git_status() {
    if ! git diff --quiet || ! git diff --staged --quiet; then
        echo -e "${YELLOW}⚠️  Working directory is not clean:${NC}"
        git status --short
        echo ""
        return 1
    fi
    return 0
}

# Function to run pre-release checks
run_pre_release_checks() {
    echo -e "${BLUE}🔍 Running pre-release checks...${NC}"
    
    # Check if we're on main/master branch
    if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
        echo -e "${YELLOW}⚠️  Not on main/master branch. Current: $CURRENT_BRANCH${NC}"
        read -p "Continue with release from this branch? (y/n): " confirm
        if [[ $confirm != "y" && $confirm != "Y" ]]; then
            echo "Cancelled"
            exit 0
        fi
    fi
    
    # Check for uncommitted changes
    if ! check_git_status; then
        echo "Options:"
        echo "  1) Commit changes and continue"
        echo "  2) Stash changes and continue"
        echo "  3) Cancel release"
        
        read -p "Choose option (1-3): " choice
        case $choice in
            1)
                git add -A
                read -p "Enter commit message: " commit_msg
                git commit -m "${commit_msg:-Pre-release commit}"
                ;;
            2)
                git stash push -m "Pre-release stash $(date '+%Y-%m-%d %H:%M:%S')"
                ;;
            *)
                echo "Cancelled"
                exit 0
                ;;
        esac
    fi
    
    # Sync with remote
    echo -e "${BLUE}🔄 Syncing with remote...${NC}"
    git fetch origin
    
    # Check if behind
    BEHIND=$(git rev-list --count HEAD..origin/"$CURRENT_BRANCH" 2>/dev/null || echo "0")
    if [ "$BEHIND" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Branch is $BEHIND commits behind origin${NC}"
        read -p "Pull latest changes? (y/n): " pull_confirm
        if [[ $pull_confirm == "y" || $pull_confirm == "Y" ]]; then
            git pull origin "$CURRENT_BRANCH"
        fi
    fi
    
    # Run tests if test script exists
    if npm run test --if-present >/dev/null 2>&1; then
        echo -e "${BLUE}🧪 Running tests...${NC}"
        if npm test; then
            echo -e "${GREEN}✓ Tests passed${NC}"
        else
            echo -e "${RED}❌ Tests failed!${NC}"
            read -p "Continue with release despite test failures? (y/n): " test_confirm
            if [[ $test_confirm != "y" && $test_confirm != "Y" ]]; then
                echo "Release cancelled due to test failures"
                exit 1
            fi
        fi
    fi
    
    # Build if build script exists
    if npm run build --if-present >/dev/null 2>&1; then
        echo -e "${BLUE}🔨 Building project...${NC}"
        if npm run build; then
            echo -e "${GREEN}✓ Build successful${NC}"
        else
            echo -e "${RED}❌ Build failed!${NC}"
            read -p "Continue with release despite build failure? (y/n): " build_confirm
            if [[ $build_confirm != "y" && $build_confirm != "Y" ]]; then
                echo "Release cancelled due to build failure"
                exit 1
            fi
        fi
    fi
    
    echo -e "${GREEN}✓ Pre-release checks completed${NC}"
}

# Function to create GitHub release
create_github_release() {
    local tag_name="$1"
    local release_name="$2"
    local is_prerelease="$3"
    
    echo -e "${BLUE}🎉 Creating GitHub release...${NC}"
    
    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI not found. Install with: brew install gh${NC}"
        echo "Manual release creation required at: https://github.com/$(git remote get-url origin | sed 's/.*github\.com[\/:]//;s/\.git$//')/releases/new"
        return
    fi
    
    # Check if authenticated
    if ! gh auth status &>/dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated. Run: gh auth login${NC}"
        return
    fi
    
    # Get changelog for this version
    local release_notes=""
    if [ -f "CHANGELOG.md" ]; then
        # Extract section for this version from changelog
        release_notes=$(awk "/^## \[$tag_name\]/{flag=1;next}/^## /{flag=0}flag" CHANGELOG.md | head -50)
    fi
    
    if [ -z "$release_notes" ]; then
        # Fallback: get recent commits
        local last_tag=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
        if [ -n "$last_tag" ]; then
            release_notes=$(git log --oneline --pretty=format:"• %s" "$last_tag"..HEAD)
        else
            release_notes=$(git log --oneline --pretty=format:"• %s" HEAD~10..HEAD)
        fi
    fi
    
    # Create release
    local prerelease_flag=""
    if [ "$is_prerelease" = true ]; then
        prerelease_flag="--prerelease"
    fi
    
    if gh release create "$tag_name" --title "$release_name" --notes "$release_notes" $prerelease_flag; then
        echo -e "${GREEN}✓ GitHub release created: $tag_name${NC}"
        local repo_url=$(gh repo view --json url -q .url)
        echo -e "${CYAN}🔗 Release URL: $repo_url/releases/tag/$tag_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to create GitHub release${NC}"
    fi
}

# Main release flow
MODE="${1:-interactive}"

case $MODE in
    patch|minor|major)
        echo -e "${BLUE}🔄 Automated $MODE release...${NC}"
        
        # Run pre-release checks
        run_pre_release_checks
        
        # Bump version
        echo -e "${BLUE}📈 Bumping version...${NC}"
        ./scripts/version.sh "$MODE"
        
        # Generate changelog
        echo -e "${BLUE}📝 Generating changelog...${NC}"
        ./scripts/changelog.sh auto
        
        # Commit changelog if it was updated
        if git diff --quiet CHANGELOG.md; then
            echo -e "${YELLOW}ℹ️  No changelog changes${NC}"
        else
            git add CHANGELOG.md
            git commit -m "📝 Update changelog for $(node -p "require('./package.json').version")

🚀 Generated by Release Manager"
        fi
        
        # Get new version and tag
        NEW_VERSION=$(node -p "require('./package.json').version")
        TAG_NAME="v$NEW_VERSION"
        
        # Push everything
        echo -e "${BLUE}📤 Pushing to remote...${NC}"
        git push origin "$CURRENT_BRANCH"
        git push --tags
        
        # Create GitHub release
        create_github_release "$TAG_NAME" "Release $TAG_NAME" false
        
        echo -e "${GREEN}✅ Automated $MODE release completed: $TAG_NAME${NC}"
        ;;
        
    feature)
        echo -e "${CYAN}✨ Feature Release Mode${NC}"
        
        # Run pre-release checks
        run_pre_release_checks
        
        read -p "Enter version (x.y.z): " VERSION
        read -p "Enter feature name: " FEATURE_NAME
        
        if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}❌ Invalid version format${NC}"
            exit 1
        fi
        
        if [ -z "$FEATURE_NAME" ]; then
            echo -e "${RED}❌ Feature name cannot be empty${NC}"
            exit 1
        fi
        
        # Update version manually
        node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            pkg.version = '$VERSION';
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        "
        
        git add package.json
        git commit -m "🔢 Bump version to v$VERSION for $FEATURE_NAME release"
        
        # Create feature tag
        TAG_NAME="v$VERSION-$FEATURE_NAME"
        git tag -a "$TAG_NAME" -m "Feature Release: $TAG_NAME

🌟 Feature: $FEATURE_NAME
📦 Version: $VERSION
📅 $(date '+%Y-%m-%d %H:%M:%S')

🚀 Generated by Release Manager"
        
        # Generate changelog
        ./scripts/changelog.sh auto
        
        # Commit changelog if updated
        if ! git diff --quiet CHANGELOG.md; then
            git add CHANGELOG.md
            git commit -m "📝 Update changelog for $TAG_NAME"
        fi
        
        # Push everything
        git push origin "$CURRENT_BRANCH"
        git push --tags
        
        # Create GitHub release (mark as prerelease if contains alpha/beta/rc)
        IS_PRERELEASE=false
        if [[ $FEATURE_NAME =~ (alpha|beta|rc|dev|preview) ]]; then
            IS_PRERELEASE=true
        fi
        
        create_github_release "$TAG_NAME" "Feature Release: $FEATURE_NAME" $IS_PRERELEASE
        
        echo -e "${GREEN}✅ Feature release completed: $TAG_NAME${NC}"
        ;;
        
    hotfix)
        echo -e "${RED}🚨 Hotfix Release Mode${NC}"
        
        # Hotfix should bump patch version automatically
        run_pre_release_checks
        
        read -p "Enter hotfix description: " HOTFIX_DESC
        
        if [ -z "$HOTFIX_DESC" ]; then
            echo -e "${RED}❌ Hotfix description cannot be empty${NC}"
            exit 1
        fi
        
        # Bump patch version
        ./scripts/version.sh patch
        
        NEW_VERSION=$(node -p "require('./package.json').version")
        
        # Update the commit message to indicate hotfix
        git commit --amend -m "🚑 Hotfix v$NEW_VERSION: $HOTFIX_DESC

🐛 Critical fix applied
🚀 Generated by Release Manager"
        
        # Generate changelog
        ./scripts/changelog.sh auto
        
        if ! git diff --quiet CHANGELOG.md; then
            git add CHANGELOG.md
            git commit -m "📝 Update changelog for hotfix v$NEW_VERSION"
        fi
        
        # Push everything
        git push origin "$CURRENT_BRANCH"
        git push --tags
        
        # Create GitHub release
        create_github_release "v$NEW_VERSION" "Hotfix v$NEW_VERSION" false
        
        echo -e "${GREEN}✅ Hotfix release completed: v$NEW_VERSION${NC}"
        ;;
        
    interactive|*)
        echo -e "${CYAN}🎯 Interactive Release Mode${NC}"
        echo ""
        echo "Release Types:"
        echo "  1) Patch Release (bug fixes: 1.0.0 → 1.0.1)"
        echo "  2) Minor Release (new features: 1.0.0 → 1.1.0)"
        echo "  3) Major Release (breaking changes: 1.0.0 → 2.0.0)"
        echo "  4) Feature Release (custom: v2.0.0-crypto-ready)"
        echo "  5) Hotfix Release (emergency patch)"
        echo "  6) Cancel"
        echo ""
        read -p "Choose release type (1-6): " choice
        
        case $choice in
            1) $0 patch ;;
            2) $0 minor ;;
            3) $0 major ;;
            4) $0 feature ;;
            5) $0 hotfix ;;
            *) echo "Cancelled" ;;
        esac
        ;;
esac

# Final summary
if [ "$MODE" != "interactive" ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 Release Process Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}📊 Summary:${NC}"
    echo "  • Version: v$(node -p "require('./package.json').version")"
    echo "  • Branch: $CURRENT_BRANCH"
    echo "  • Tags: $(git tag -l | tail -1)"
    echo ""
    echo -e "${BLUE}🔗 Quick Links:${NC}"
    echo "  • Repository: $(git remote get-url origin)"
    echo "  • Releases: $(git remote get-url origin | sed 's/\.git$//')/releases"
    echo "  • Changelog: ./CHANGELOG.md"
fi