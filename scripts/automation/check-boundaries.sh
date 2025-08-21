#!/bin/bash

# Platform Boundary Checker
# Monitors and reports on platform ownership violations

set -e

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}    🛡️ PLATFORM BOUNDARY CHECKER${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to detect current platform
detect_current_platform() {
    if [ -n "$LOVABLE_ENV" ] || [ -n "$LOVABLE" ]; then
        echo "lovable"
    elif [ -n "$REPLIT" ] || [ -n "$REPL_ID" ]; then
        echo "replit"
    elif pgrep -f "lovable" >/dev/null 2>&1; then
        echo "lovable"
    elif [ -f ".replit" ] || [ -d ".config" ]; then
        echo "replit"
    else
        echo "claude-code"
    fi
}

# Function to check folder ownership
check_folder_ownership() {
    echo -e "${BLUE}📁 Checking folder structure...${NC}"
    
    # Check each folder with expected ownership
    if [ -d "frontend/" ]; then
        echo -e "  ${GREEN}✓${NC} frontend/ → ${YELLOW}claude-code${NC}"
    else
        echo -e "  ${YELLOW}!${NC} frontend/ → ${RED}missing${NC}"
    fi
    
    if [ -d "contracts/" ]; then
        echo -e "  ${GREEN}✓${NC} contracts/ → ${YELLOW}replit${NC}"
    else
        echo -e "  ${YELLOW}!${NC} contracts/ → ${RED}missing${NC}"
    fi
    
    if [ -d "lovable/" ]; then
        echo -e "  ${GREEN}✓${NC} lovable/ → ${YELLOW}lovable${NC}"
    else
        echo -e "  ${YELLOW}!${NC} lovable/ → ${RED}missing${NC}"
    fi
    
    if [ -d "shared/" ]; then
        echo -e "  ${CYAN}✓${NC} shared/ → ${CYAN}all-platforms${NC}"
    else
        echo -e "  ${YELLOW}!${NC} shared/ → ${RED}missing${NC}"
    fi
    
    if [ -d "scripts/" ]; then
        echo -e "  ${GREEN}✓${NC} scripts/ → ${YELLOW}claude-code${NC}"
    else
        echo -e "  ${YELLOW}!${NC} scripts/ → ${RED}missing${NC}"
    fi
}

# Function to analyze recent commits by platform
analyze_platform_activity() {
    echo ""
    echo -e "${BLUE}📊 Recent platform activity...${NC}"
    
    if [ ! -f ".git/platform-activity.log" ]; then
        echo -e "${YELLOW}  No activity log found${NC}"
        return
    fi
    
    # Get last 10 commits per platform
    echo ""
    echo -e "${CYAN}Last 5 commits per platform:${NC}"
    
    for platform in "claude-code" "lovable" "replit"; do
        echo ""
        echo -e "${YELLOW}  $platform:${NC}"
        grep "| $platform |" .git/platform-activity.log | tail -5 | while IFS='|' read -r date plat hash files msg; do
            echo -e "    ${BLUE}$(echo $date | xargs)${NC} - $files - $(echo $msg | xargs)"
        done
    done
}

# Function to scan for potential violations
scan_violations() {
    local platform="$1"
    echo ""
    echo -e "${BLUE}🔍 Scanning for boundary violations...${NC}"
    
    local violations_found=false
    
    # Check if current platform has files in restricted areas
    case $platform in
        lovable)
            if [ -n "$(find frontend/ -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null)" ]; then
                echo -e "${YELLOW}  ⚠ Lovable detected with frontend/ files${NC}"
                violations_found=true
            fi
            if [ -n "$(find contracts/ -type f 2>/dev/null)" ]; then
                echo -e "${YELLOW}  ⚠ Lovable detected with contracts/ files${NC}"
                violations_found=true
            fi
            ;;
        replit)
            if [ -n "$(find frontend/ -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null)" ]; then
                echo -e "${YELLOW}  ⚠ Replit detected with frontend/ files${NC}"
                violations_found=true
            fi
            if [ -n "$(find lovable/ -type f 2>/dev/null)" ]; then
                echo -e "${YELLOW}  ⚠ Replit detected with lovable/ files${NC}"
                violations_found=true
            fi
            ;;
        claude-code)
            # Claude Code has broader access, check for good practices
            echo -e "${GREEN}  ✓ Claude Code has full access${NC}"
            ;;
    esac
    
    if [ "$violations_found" = false ]; then
        echo -e "${GREEN}  ✓ No boundary violations detected${NC}"
    fi
}

# Function to show platform status
show_platform_status() {
    local current_platform="$1"
    
    echo ""
    echo -e "${BLUE}🎯 Current Platform: ${YELLOW}$current_platform${NC}"
    
    case $current_platform in
        claude-code)
            echo -e "${GREEN}  ✓ Full repository access${NC}"
            echo -e "${CYAN}  📁 Can modify: frontend/, contracts/, lovable/, shared/, scripts/, configs${NC}"
            echo -e "${YELLOW}  💡 Best practice: Use platform-specific folders when possible${NC}"
            ;;
        lovable)
            echo -e "${GREEN}  ✓ Design-focused access${NC}"
            echo -e "${CYAN}  📁 Should modify: lovable/, shared/components/, shared/styles/${NC}"
            echo -e "${RED}  ❌ Avoid: frontend/, contracts/, scripts/${NC}"
            ;;
        replit)
            echo -e "${GREEN}  ✓ Contract-focused access${NC}"
            echo -e "${CYAN}  📁 Should modify: contracts/, shared/types/, shared/interfaces/${NC}"
            echo -e "${RED}  ❌ Avoid: frontend/, lovable/, scripts/${NC}"
            ;;
    esac
}

# Function to generate recommendations
generate_recommendations() {
    local platform="$1"
    
    echo ""
    echo -e "${BLUE}💡 Recommendations for ${YELLOW}$platform${BLUE}:${NC}"
    
    case $platform in
        claude-code)
            echo -e "${CYAN}  • Use frontend/ for React components and main app logic${NC}"
            echo -e "${CYAN}  • Use scripts/ for automation and build tools${NC}"
            echo -e "${CYAN}  • Coordinate cross-platform changes${NC}"
            echo -e "${CYAN}  • Manage releases and versioning${NC}"
            ;;
        lovable)
            echo -e "${CYAN}  • Keep UI designs in lovable/ folder${NC}"
            echo -e "${CYAN}  • Use shared/components/ for reusable React components${NC}"
            echo -e "${CYAN}  • Use shared/styles/ for CSS and styling${NC}"
            echo -e "${CYAN}  • Sync frequently: ./sync-start.sh && ./sync-save.sh${NC}"
            ;;
        replit)
            echo -e "${CYAN}  • Keep smart contracts in contracts/src/${NC}"
            echo -e "${CYAN}  • Use contracts/deploy/ for deployment scripts${NC}"
            echo -e "${CYAN}  • Use shared/types/ for TypeScript interfaces${NC}"
            echo -e "${CYAN}  • Test contracts thoroughly before committing${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}  🔄 Always sync before major changes: ./sync-start.sh${NC}"
    echo -e "${YELLOW}  📤 Save and sync after changes: ./sync-save.sh${NC}"
}

# Function to create boundary report
create_boundary_report() {
    local report_file=".git/boundary-report.txt"
    
    {
        echo "Platform Boundary Report"
        echo "Generated: $(date)"
        echo "Platform: $(detect_current_platform)"
        echo "=================================="
        echo ""
        
        echo "Folder Structure:"
        ls -la | grep "^d" | awk '{print $9}' | grep -v "^\\.$\\|^\\.\\.$" | while read -r dir; do
            echo "  $dir/"
        done
        
        echo ""
        echo "Recent Activity:"
        if [ -f ".git/platform-activity.log" ]; then
            tail -10 .git/platform-activity.log
        else
            echo "  No activity log found"
        fi
        
        echo ""
        echo "Git Status:"
        git status --porcelain || echo "  Clean working directory"
        
    } > "$report_file"
    
    echo -e "${GREEN}📄 Boundary report saved: ${CYAN}$report_file${NC}"
}

# Main execution
CURRENT_PLATFORM=$(detect_current_platform)

# Command line options
case "${1:-check}" in
    check)
        check_folder_ownership
        show_platform_status "$CURRENT_PLATFORM"
        scan_violations "$CURRENT_PLATFORM"
        generate_recommendations "$CURRENT_PLATFORM"
        ;;
    activity)
        analyze_platform_activity
        ;;
    report)
        create_boundary_report
        ;;
    status)
        show_platform_status "$CURRENT_PLATFORM"
        ;;
    help)
        echo "Platform Boundary Checker Usage:"
        echo ""
        echo "  ./scripts/check-boundaries.sh check     - Full boundary check (default)"
        echo "  ./scripts/check-boundaries.sh activity  - Show platform activity log"
        echo "  ./scripts/check-boundaries.sh report    - Generate detailed report"
        echo "  ./scripts/check-boundaries.sh status    - Show current platform status"
        echo ""
        echo "Platform Rules:"
        echo "  • Claude Code: frontend/, shared/, configs, scripts"
        echo "  • Lovable: lovable/, shared/components/, shared/styles/"
        echo "  • Replit: contracts/, shared/types/, shared/interfaces/"
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run './scripts/check-boundaries.sh help' for usage"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Boundary check completed${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"