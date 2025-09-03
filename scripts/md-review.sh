#!/bin/bash

# MD Command - Force agent review of CLAUDE.md guardrails
# Usage: ./scripts/md-review.sh [violation-type]

echo "🚨 MANDATORY GUARDRAIL REVIEW - CLAUDE.md"
echo "=========================================="
echo ""

# Check if CLAUDE.md exists and is accessible
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ CRITICAL: CLAUDE.md not found in current directory"
    echo "Agent must have access to project guardrails"
    exit 1
fi

VIOLATION_TYPE=${1:-"general"}

echo "🔍 GUARDRAIL VIOLATION DETECTED: $VIOLATION_TYPE"
echo ""

case $VIOLATION_TYPE in
    "port")
        echo "📋 REVIEWING: PORT CONFLICT PREVENTION GUARDRAILS"
        echo "Location: Lines 501-679 in CLAUDE.md"
        echo ""
        echo "KEY REQUIREMENTS:"
        echo "• Check port availability before binding (lsof -i :PORT)"
        echo "• Use port ranges: 3000-3099 (frontend), 3100-3199 (backend)"
        echo "• Update ~/docs/port-registry.md IMMEDIATELY"
        echo "• Run ~/bin/port-check before ANY service start"
        echo ""
        ;;
    
    "app")
        echo "📋 REVIEWING: APP ACCESS TRACKING GUARDRAILS" 
        echo "Location: Lines 681-808 in CLAUDE.md"
        echo ""
        echo "KEY REQUIREMENTS:"
        echo "• Update app dashboard after creating/modifying ANY application"
        echo "• Run ~/bin/update-app-dashboard"
        echo "• Document: Name, Location, Port, URL, Status, Technology"
        echo "• Ensure user can access all apps via dashboard"
        echo ""
        ;;
        
    "integration")
        echo "📋 REVIEWING: INTEGRATION SPRAWL PREVENTION"
        echo "Location: Lines 886-1045 in CLAUDE.md"
        echo ""
        echo "KEY REQUIREMENTS:"
        echo "• ONE service, ONE implementation, ONE location"
        echo "• Search existing: grep -r \"ServiceName\" . --include=\"*.js\""
        echo "• Use ~/.claude-flow/integrations/[service]/ ONLY"
        echo "• Document decisions in ~/integration-decisions.log"
        echo ""
        ;;
        
    "concurrent")
        echo "📋 REVIEWING: CONCURRENT EXECUTION & FILE MANAGEMENT"
        echo "Location: Lines 133-157 in CLAUDE.md"
        echo ""
        echo "KEY REQUIREMENTS:"
        echo "• ALL operations MUST be concurrent/parallel in single message"
        echo "• Batch TodoWrite (5-10+ todos), Task tool (multiple agents)"
        echo "• NEVER save files to root folder - use /src, /tests, /docs"
        echo "• Quote paths with spaces: \"path with spaces\""
        echo ""
        ;;
        
    "supabase")
        echo "📋 REVIEWING: SUPABASE AUTONOMY RULES"
        echo "Location: Lines 825-884 in CLAUDE.md"
        echo ""
        echo "KEY REQUIREMENTS:"
        echo "• YOU create schemas, run migrations, manage database"
        echo "• YOU set up auth, create functions - NO DELEGATION"
        echo "• Execute: supabase db push/pull, migration new/up"
        echo "• NO asking user to do Supabase work"
        echo ""
        ;;
        
    "code")
        echo "📋 REVIEWING: CODE GENERATION SAFETY CHECKS"
        echo "Location: Lines 38-62 in CLAUDE.md"
        echo ""
        echo "KEY REQUIREMENTS:"
        echo "• Check: No hardcoded secrets, SQL injection, XSS vectors"
        echo "• Verify library exists in package.json before using"
        echo "• Follow project structure: /src, /tests, /docs directories" 
        echo "• Use existing patterns from codebase"
        echo ""
        ;;
        
    *)
        echo "📋 REVIEWING: MANDATORY AGENT PROTOCOLS"
        echo "Location: Lines 1-62 in CLAUDE.md"
        echo ""
        echo "CRITICAL AGENT RULES:"
        echo "• AGENTS MUST DO, NOT DELEGATE"
        echo "• Create, Execute, Manage, Fix, Complete - ALL yourself"
        echo "• Before ANY action: Identify category → Review guardrails → Execute protocols"
        echo "• VIOLATION = IMMEDIATE TASK FAILURE"
        echo ""
        ;;
esac

echo "🎯 REQUIRED ACTIONS:"
echo "1. READ the relevant section in CLAUDE.md"
echo "2. ACKNOWLEDGE which guardrails were violated"
echo "3. DEMONSTRATE correct protocol execution"
echo "4. RESTART task with proper compliance"
echo ""

echo "📖 FULL DOCUMENT: $(pwd)/CLAUDE.md"
echo "📊 File size: $(wc -c < CLAUDE.md) bytes (optimized)"
echo ""

# Show violation consequences
echo "🚫 VIOLATION CONSEQUENCES:"
echo "• 1st: Warning + correction"
echo "• 2nd: Task termination + protocol review"  
echo "• 3rd: Agent replacement + process audit"
echo ""

echo "✅ GUARDRAIL REVIEW COMPLETE - PROCEED WITH COMPLIANCE"