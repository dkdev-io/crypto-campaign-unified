# Claude Code Configuration - SPARC Development Environment

# 🚨 MANDATORY AGENT PROTOCOL - READ FIRST

## 🔥 AGENT AUTONOMY RULES - DO THE WORK, DON'T ASK

### CRITICAL: AGENTS MUST DO, NOT DELEGATE

**AGENTS: You have FULL PERMISSION and RESPONSIBILITY to:**
1. **CREATE** - Build schemas, write migrations, set up databases
2. **EXECUTE** - Run commands, apply changes, deploy functions
3. **MANAGE** - Handle configurations, secrets, environments
4. **FIX** - Debug issues, resolve conflicts, handle errors
5. **COMPLETE** - Finish tasks end-to-end without asking user to do parts

### ❌ NEVER SAY (Examples of what NOT to do):
- "You'll need to create a table..." → **WRONG! YOU create the table**
- "Please run `supabase db push`..." → **WRONG! YOU run the command**
- "Set up authentication by..." → **WRONG! YOU set up authentication**
- "The user should configure..." → **WRONG! YOU configure it**
- "Ask me for credentials..." → **OK, only for secrets you don't have**

### ✅ ALWAYS DO (Examples of correct behavior):
- "I'll create the schema now..." → **CORRECT! Take action**
- "Running `supabase db push`..." → **CORRECT! Execute directly**
- "Setting up authentication..." → **CORRECT! Do it yourself**
- "Configuring the service..." → **CORRECT! Handle it**
- "I need your API key..." → **CORRECT! Only ask for what you can't access**

### SUPABASE-SPECIFIC AUTONOMY:
- **Schemas**: Create tables, views, functions, triggers yourself
- **Migrations**: Write, apply, rollback migrations yourself
- **Auth**: Configure providers, policies, rules yourself
- **Storage**: Set up buckets, policies yourself
- **Functions**: Write, deploy, manage edge functions yourself
- **Testing**: Create test data, run tests yourself

## BEFORE ANY ACTION, EVERY AGENT MUST:

1. **Identify Task Category**: [PORT_OPS/APP_ACCESS/INTEGRATION/SESSION/FILE_OPS/SERVICE_STARTS/CODE_GENERATION]
2. **Review Relevant Guardrails**: Search CLAUDE.md for applicable sections  
3. **Execute Required Protocols**: Run mandatory commands/checks
4. **Acknowledge Compliance**: State which guardrails were followed
5. **Proceed with Action**: Only after guardrail compliance

### 🔒 MANDATORY CODE GENERATION SAFETY CHECKS

**BEFORE GENERATING ANY CODE, AGENTS MUST:**

1. **Check: Does this violate security rules?**
   - No hardcoded secrets, API keys, or passwords
   - No SQL injection vulnerabilities
   - No XSS attack vectors
   - Follow authentication/authorization patterns
   - Validate all inputs

2. **Check: Does this use only approved libraries?**
   - Verify library exists in package.json
   - Check if library is already used in codebase
   - No unapproved dependencies without explicit permission
   - Use existing utility functions when available

3. **Check: Does this follow the project structure?**
   - Files go in correct directories (/src, /tests, /docs, etc.)
   - Follow existing naming conventions
   - Use established patterns from codebase
   - Import from correct paths (@/ aliases)
   - Match existing code style and architecture

**CODE GENERATION WITHOUT THESE CHECKS = IMMEDIATE TASK FAILURE**

### Quick Guardrail Reference:
- **Port Operations** → Section: PORT CONFLICT PREVENTION GUARDRAILS
- **App Access** → Section: APP ACCESS TRACKING GUARDRAILS  
- **Integrations** → Section: INTEGRATION SPRAWL PREVENTION GUARDRAILS
- **Sessions** → Section: SESSION CHECKOUT/STARTUP COMMANDS
- **File Operations** → Section: CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT
- **Service Starts** → Section: PORT CONFLICT PREVENTION GUARDRAILS
- **Code Generation** → Section: MANDATORY CODE GENERATION SAFETY CHECKS

**VIOLATION = IMMEDIATE TASK FAILURE**

### MANDATORY GUARDRAIL CHECK PROTOCOL

**BEFORE ANY ACTION, AGENTS MUST:**

#### STEP 1: GUARDRAIL ACKNOWLEDGMENT (REQUIRED)
```bash
echo "✅ GUARDRAIL CHECK: $(date)"
echo "Agent: [AGENT_NAME] reviewing guardrails for: [TASK_DESCRIPTION]"
```

#### STEP 2: RELEVANT GUARDRAIL IDENTIFICATION
- Port conflicts → Run port-check protocol
- File operations → Check integration sprawl prevention
- Service starts → Check checkout/startup protocols
- App access → Update app dashboard
- Session work → Check session protocols

#### STEP 3: EXPLICIT GUARDRAIL COMPLIANCE STATEMENT
"I have reviewed and will comply with: [LIST_SPECIFIC_GUARDRAILS]"

### 🎯 CONTEXT-BASED GUARDRAIL TRIGGERS

#### Port/Service Operations
**TRIGGER WORDS**: port, localhost, serve, start, dev, 3000-9000
**MANDATORY**: Execute port conflict prevention protocol

#### File/App Operations  
**TRIGGER WORDS**: app, application, running, access, dashboard
**MANDATORY**: Update app access tracking

#### Code Generation Operations
**TRIGGER WORDS**: code, function, component, class, interface, import, export
**MANDATORY**: Execute code generation safety checks

#### Session Management
**TRIGGER WORDS**: checkout, startup, session, work
**MANDATORY**: Execute session protocols

#### Integration Work
**TRIGGER WORDS**: service, integration, API, connect
**MANDATORY**: Check integration sprawl prevention

### 🚫 GUARDRAIL VIOLATION CONSEQUENCES

#### IMMEDIATE ACTIONS FOR VIOLATIONS:
1. **STOP** current task immediately
2. **ACKNOWLEDGE** the violation explicitly  
3. **EXPLAIN** which guardrail was missed
4. **DEMONSTRATE** correct protocol execution
5. **RESTART** task with proper guardrail compliance

#### ESCALATING ENFORCEMENT:
- 1st violation: Warning + correction
- 2nd violation: Task termination + protocol review
- 3rd violation: Agent replacement + process audit

---

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

## SPARC Commands

### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Linting
- `npm run typecheck` - Type checking

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Available Agents (54 Total)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Migration & Planning
`migration-planner`, `swarm-init`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL:
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY:
- Coordination and planning
- Memory management
- Neural features
- Performance tracking
- Swarm orchestration
- GitHub integration

**KEY**: MCP coordinates, Claude Code executes.

## 🚀 Quick Setup

```bash
# Add Claude Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

## MCP Tool Categories

### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System
`benchmark_run`, `features_detect`, `swarm_monitor`

## 📋 Agent Coordination Protocol

### Every Agent MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT (Single Message):
```javascript
[BatchTool]:
  // Initialize swarm
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  
  // Spawn agents with Task tool
  Task("Research agent: Analyze requirements...")
  Task("Coder agent: Implement features...")
  Task("Tester agent: Create test suite...")
  
  // Batch todos
  TodoWrite { todos: [
    {id: "1", content: "Research", status: "in_progress", priority: "high"},
    {id: "2", content: "Design", status: "pending", priority: "high"},
    {id: "3", content: "Implement", status: "pending", priority: "high"},
    {id: "4", content: "Test", status: "pending", priority: "medium"},
    {id: "5", content: "Document", status: "pending", priority: "low"}
  ]}
  
  // File operations
  Bash "mkdir -p app/{src,tests,docs}"
  Write "app/src/index.js"
  Write "app/tests/index.test.js"
  Write "app/docs/README.md"
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues

---

Remember: **Claude Flow coordinates, Claude Code creates!**

## 📚 Claude Code Full Tool Awareness

### Complete Tool Reference (16 Tools)

#### File Operations
- **Read**: Read files, images, PDFs, Jupyter notebooks (multimodal support)
- **Write**: Create new files (must read existing files first)
- **Edit**: Precise string replacements (single edit)
- **MultiEdit**: Multiple edits to single file (batch operation)
- **NotebookEdit**: Edit Jupyter notebook cells

#### Search & Navigation
- **Glob**: Fast file pattern matching (e.g., "**/*.js")
- **Grep**: Powerful regex search (ripgrep-based, multiline support)
- **LS**: List directory contents (absolute paths required)

#### Shell & System
- **Bash**: Execute commands (timeout up to 600000ms, background support)
- **BashOutput**: Get output from background shells
- **KillBash**: Terminate background processes

#### Web & Task Management
- **WebSearch**: Search web for current information (US only)
- **WebFetch**: Fetch and analyze web content (15-min cache)
- **TodoWrite**: Task management (only ONE in_progress at a time)
- **ExitPlanMode**: Exit planning mode to start coding
- **Task**: Spawn 54 specialized agents for parallel execution

### Current Capabilities Summary
- ✅ All major programming languages
- ✅ 54 specialized AI agents for parallel work
- ✅ 2.8-4.4x faster with parallel execution
- ✅ Git/GitHub integration (gh CLI)
- ✅ TDD/BDD workflows
- ✅ Multi-modal support (text, images, PDFs)
- ✅ Background process management
- ✅ Web search and content fetching
- ✅ Automated testing frameworks

### Critical Workflow Patterns
- **ALWAYS batch operations**: Multiple tools in ONE message
- **Read before Edit/Write**: Must read files before modifying
- **Use absolute paths**: Never relative paths
- **Quote paths with spaces**: "path with spaces"
- **Tool precedence**: Grep > grep, Glob > find, Read > cat
- **Concurrent agents**: Launch multiple agents together
- **Immediate todo updates**: Mark complete right after finishing
- **Run linting**: After code changes (npm run lint, etc.)

### Tool Usage Quick Reference
```javascript
// Batch operations (CORRECT)
Read(file1); Read(file2); Edit(file3)  // Single message

// Search patterns
Glob("**/*.test.js")  // Find test files
Grep("function.*async", {multiline: true})  // Cross-line search

// Background execution
Bash("npm run dev", run_in_background=true)
BashOutput(bash_id)  // Check output later

// Agent orchestration
Task("coder", "Implement feature X")
Task("tester", "Write tests for X")
Task("reviewer", "Review implementation")
```

### Performance Optimizations
- Batch file operations: 70% faster
- Parallel agent execution: 2.8-4.4x speedup
- Smart caching: 15-min WebFetch cache
- Token optimization: 32.3% reduction
- Concurrent bash commands: Significant time savings

### Common Issues & Solutions
- **Edit fails**: Add more context to make old_string unique
- **Path errors**: Always use absolute paths and quote spaces
- **Timeout**: Increase timeout or use background execution
- **Agent blocked**: Check hooks configuration
- **No matches**: Use broader search patterns or Task agent

### Documentation Location
Full documentation available in `/docs/claude-code/`:
- tool-reference.md - Complete tool documentation
- capabilities.md - All capabilities listed
- best-practices.md - Usage guidelines
- workflow-patterns.md - Common patterns
- troubleshooting.md - Issue solutions
- advanced-features.md - Advanced usage

## 🛑 SESSION CHECKOUT COMMAND

When user says "checkout" or "/checkout", execute complete session termination protocol:

### CHECKOUT PROTOCOL (MANDATORY - NO SHORTCUTS):

**1. GIT OPERATIONS:**
- Check git status for uncommitted changes
- Stage all changes: `git add .`
- Create meaningful commit message based on work accomplished
- Push to GitHub: `git push origin main`
- Verify push succeeded

**2. CODE REVIEW & LOOSE ENDS:**
- Scan modified files for TODOs, console.logs, incomplete code
- Flag any issues for immediate attention
- Note work needing continuation in next session

**3. APP ACCESS DASHBOARD UPDATE (MANDATORY):**
- **CRITICAL**: Update app access dashboard with current session's work
- Scan for new/modified applications and their ports
- Update dashboard with accessible URLs and file locations
- Ensure user can easily access all created/modified apps

**DASHBOARD UPDATE PROTOCOL:**
```bash
# STEP 1: Scan and update app information
~/bin/update-app-dashboard

# STEP 2: Verify dashboard accessibility
ls -la ~/docs/app-access-dashboard.html

# STEP 3: Record app access info in session notes
echo "## App Access Information" >> session-notes.md
echo "Dashboard: file://$HOME/docs/app-access-dashboard.html" >> session-notes.md
~/bin/scan-apps summary >> session-notes.md
```

**4. SECOND BRAIN DOCUMENTATION:**
- Create comprehensive session summary
- Document work accomplished, decisions made, problems solved
- Save to session logs with searchable metadata
- Link to git commits and file changes
- **MUST INCLUDE**: Direct links to all modified/created app access points

**5. PACHACUTI COORDINATION:**
- Generate CTO summary (resource usage, progress, optimization opportunities)
- Flag strategic decisions needing review
- Update project coordination data

**6. NEXT SESSION PREP:**
- Document stopping point and context
- Prepare restoration information
- Note immediate next steps

**7. FINAL VERIFICATION:**
- Confirm GitHub updated ✅
- Confirm session documented ✅  
- Confirm Pachacuti has data ✅
- **Confirm app dashboard updated** ✅
- **Confirm app access documented** ✅
- Ready for clean termination ✅

Execute ALL steps when user says "checkout" - no exceptions.

**8. CHECKOUT COMPLETION:**
- Always end checkout process by saying: "checkout completed."

## 🚀 PROJECT STARTUP COMMAND

When user says "startup [project-name]" or just "startup", execute complete project initialization protocol:

### STARTUP PROTOCOL (MANDATORY):

**1. PROJECT IDENTIFICATION & SETUP:**
- Identify current project from directory or user specification
- Load project-specific context and configuration
- Restore previous session state and priorities
- Check project health and dependencies

**2. OVERALL TASK MANAGER COORDINATION:**
- Connect with Pachacuti (CTO) for company-wide context
- Get current project priorities and resource allocation
- Check for cross-project dependencies and conflicts
- Update company-wide project status

**3. PROJECT-SPECIFIC AGENT ACTIVATION:**
- Spawn or connect to dedicated project manager agent
- Load project-specific goals, constraints, and context
- Initialize project workflows and automation
- Set up project-specific monitoring and tracking

**4. ENVIRONMENT PREPARATION:**
- git pull latest changes
- Check for dependency updates or issues
- Verify development environment setup
- Initialize any required services or tools

**5. CONTEXT RESTORATION:**
- Load last session summary and stopping point
- Review recent progress and completed work
- Identify immediate priorities and blockers
- Prepare work queue and next actions

**6. COORDINATION SETUP:**
- Establish communication between agents
- Set up progress reporting and monitoring
- Configure approval workflows and decision making
- Initialize session documentation and tracking

**7. READY STATE CONFIRMATION:**
- Confirm all systems operational
- Verify agent coordination working
- Display current project status and priorities
- Ready for productive development work

Execute ALL steps when user says "startup" - coordinate all agents properly.

**8. STARTUP COMPLETION:**
- Always end startup process by saying: "Start up complete, ready to work."

## 🚫 PORT CONFLICT PREVENTION GUARDRAILS

### 🔴 ABSOLUTE REQUIREMENT: "CHECK BEFORE BIND"

**CRITICAL FOR ALL AGENTS**: Every agent MUST check port availability before starting ANY service. Port conflicts are the #1 cause of development failures.

### MANDATORY PORT CHECK PROTOCOL

**BEFORE ANY SERVICE START, AGENTS MUST:**

```bash
# STEP 1: CHECK PORT AVAILABILITY (NON-NEGOTIABLE)
port_to_use=3000  # Example port

# Check if port is in use
if lsof -i :$port_to_use > /dev/null 2>&1; then
    echo "❌ BLOCKED: Port $port_to_use is already in use!"
    echo "Running process:"
    lsof -i :$port_to_use
    
    # MUST find alternative port
    for alt_port in $(seq $((port_to_use + 100)) $((port_to_use + 200))); do
        if ! lsof -i :$alt_port > /dev/null 2>&1; then
            echo "✅ Using alternative port: $alt_port"
            port_to_use=$alt_port
            break
        fi
    done
else
    echo "✅ Port $port_to_use is available"
fi

# STEP 2: CHECK PORT REGISTRY
cat ~/docs/port-registry.md | grep -E "^.*Port $port_to_use.*$"
if [ $? -eq 0 ]; then
    echo "⚠️ WARNING: Port $port_to_use is registered to another service"
    echo "Verify this is the correct application before proceeding"
fi

# STEP 3: USE port-check TOOL
~/bin/port-check $port_to_use
```

### PORT ALLOCATION RULES

**RESERVED PORT RANGES:**
```
3000-3099: Frontend applications (React, Next.js, Vue)
3100-3199: Backend APIs  
3200-3299: Microservices
5000-5099: Alternative backends
5170-5199: Vite development servers
8000-8099: Python/Django servers
8500-8599: Blockchain/Web3 services
```

**PORT ASSIGNMENT PROTOCOL:**
1. Check `~/docs/port-registry.md` for assigned port
2. If no assignment exists, use next available in range
3. Update port-registry.md IMMEDIATELY after assignment
4. Commit port assignment to git

### ENFORCEMENT & CONSEQUENCES

**VIOLATIONS TRIGGER:**
- ❌ Immediate task termination
- ❌ Error report to user
- ❌ Requirement to fix before proceeding
- ❌ Documentation in violation log

**PORT CONFLICT DETECTION:**
```bash
# Agents MUST run this check before EVERY service start
#!/bin/bash
check_port_conflicts() {
    local port=$1
    local service=$2
    
    # Check if port is in use
    if lsof -i :$port > /dev/null 2>&1; then
        echo "🚨 CRITICAL: Port conflict detected!"
        echo "Port $port is already in use by:"
        lsof -i :$port
        
        # Log violation
        echo "$(date): $service attempted to use occupied port $port" >> ~/port-violations.log
        
        # MUST STOP - DO NOT PROCEED
        exit 1
    fi
    
    # Check port registry
    assigned=$(grep "^| .* | $port |" ~/docs/port-registry.md | head -1)
    if [ ! -z "$assigned" ] && ! echo "$assigned" | grep -q "$service"; then
        echo "⚠️ WARNING: Port $port is assigned to different service"
        echo "$assigned"
        echo "Confirm this is intentional before proceeding"
    fi
}
```

### PRE-COMMIT PORT VALIDATION

**Add to `.git/hooks/pre-commit`:**
```bash
#!/bin/bash
# Prevent committing services with port conflicts

# Check all .env files for PORT assignments
for env_file in $(find . -name ".env*" -type f 2>/dev/null); do
    port=$(grep "^PORT=" "$env_file" | cut -d= -f2)
    if [ ! -z "$port" ]; then
        # Verify port is documented
        if ! grep -q "| .* | $port |" ~/docs/port-registry.md; then
            echo "❌ BLOCKED: Port $port in $env_file not documented in port-registry.md"
            exit 1
        fi
    fi
done
```

### PORT REGISTRY UPDATE REQUIREMENTS

**EVERY port assignment MUST update `~/docs/port-registry.md`:**
```markdown
| Application | Port | Status | Technology | Path |
|------------|------|--------|------------|------|
| YourApp | 3XXX | CONFIGURED/RUNNING | Tech | /path |
```

**Status values:**
- `CONFIGURED`: Port assigned but service not running
- `RUNNING`: Service actively using port
- `DEPRECATED`: Old assignment, being migrated

### AGENT STARTUP CHECKLIST

**BEFORE starting ANY service, EVERY agent MUST:**
- [ ] Run `~/bin/port-check all` to see current usage
- [ ] Check assigned port in `~/docs/port-registry.md`
- [ ] Verify port availability with `lsof -i :PORT`
- [ ] If conflict, find alternative port in correct range
- [ ] Update .env with correct port
- [ ] Update port-registry.md
- [ ] Test service starts successfully
- [ ] Commit port configuration changes

### PORT CONFLICT RECOVERY

**If port conflict occurs:**
```bash
# 1. Identify conflicting process
lsof -i :PORT

# 2. Determine if it should be killed
ps aux | grep PID

# 3. If safe to kill:
~/bin/port-check kill PORT

# 4. If not safe, find alternative:
for port in $(seq START END); do
    if ! lsof -i :$port > /dev/null 2>&1; then
        echo "Available: $port"
        break
    fi
done

# 5. Update all references to new port
grep -r "PORT.*OLD_PORT" . --include="*.env*"
grep -r "localhost:OLD_PORT" . --include="*.js" --include="*.ts"

# 6. Update port-registry.md
```

### MONITORING & ALERTS

**Real-time port monitoring:**
```bash
# Run periodically to detect conflicts
~/bin/port-monitor

# Alert on conflicts
watch -n 5 '~/bin/port-check all | grep -E "3[0-9]{3}|5[0-9]{3}|8[0-9]{3}"'
```

### COMMON VIOLATIONS TO AVOID

**❌ NEVER DO THIS:**
```javascript
// BAD: No port checking
app.listen(3000, () => console.log('Server started'));

// BAD: Hardcoded port without check
const PORT = 3001;
server.listen(PORT);
```

**✅ ALWAYS DO THIS:**
```javascript
// GOOD: Check and fallback
const checkPort = require('detect-port');
const PORT = await checkPort(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

// GOOD: Environment-based with validation
const PORT = process.env.PORT || 3000;
// But FIRST run shell script to verify port is available!
```

---

## 📊 APP ACCESS TRACKING GUARDRAILS

### 🎯 MANDATORY REQUIREMENT: "TRACK WHERE USERS CAN ACCESS APPS"

**CRITICAL FOR ALL AGENTS**: Every time you create, modify, or deploy an application, you MUST update the app access dashboard so users know where to find and access their apps.

### MANDATORY APP ACCESS PROTOCOL

**AFTER CREATING/MODIFYING ANY APPLICATION:**

```bash
# STEP 1: UPDATE DASHBOARD (NON-NEGOTIABLE)
~/bin/update-app-dashboard

# STEP 2: VERIFY DASHBOARD UPDATE
ls -la ~/docs/app-access-dashboard.html
echo "✅ Dashboard updated: $(date)"

# STEP 3: DOCUMENT ACCESS INFORMATION
echo "## New/Updated App Access" >> current-session-notes.md
echo "- App: [APP_NAME]" >> current-session-notes.md
echo "- Location: [FULL_PATH]" >> current-session-notes.md
echo "- Port: [PORT_NUMBER]" >> current-session-notes.md
echo "- URL: http://localhost:[PORT]" >> current-session-notes.md
echo "- Status: [RUNNING/CONFIGURED]" >> current-session-notes.md
```

### APP INFORMATION REQUIREMENTS

**EVERY APP ENTRY MUST INCLUDE:**
- **Name**: Clear, descriptive application name
- **Location**: Full file system path where app is stored
- **Port**: Port number if web application (or "N/A")
- **Access URL**: Direct clickable link if applicable
- **Status**: RUNNING, CONFIGURED, or STOPPED
- **Technology**: Framework/language (React, Next.js, Python, etc.)
- **Description**: Brief explanation of what the app does

### CHECKOUT INTEGRATION

**DURING EVERY CHECKOUT, AGENTS MUST:**
1. Run `~/bin/update-app-dashboard` (automatically scans and updates)
2. Verify dashboard file exists and is current
3. Include app access summary in session documentation
4. Provide direct dashboard link to user

### USER ACCESS REQUIREMENTS

**MAKE IT EASY FOR USERS:**
- Dashboard must be accessible via file:// URL
- All running apps must show clickable localhost links
- File locations must be accurate and up-to-date
- Status must reflect actual app state (running vs configured)

### AGENT RESPONSIBILITIES

**BEFORE ENDING ANY SESSION WHERE APPS WERE MODIFIED:**
```bash
# 1. Scan current directory for new/modified apps
find . -name "package.json" -o -name "*.py" -o -name "*.html" | head -10

# 2. Update app tracking
~/bin/update-app-dashboard

# 3. Provide user with access information
echo "🚀 App Access Dashboard: file://$HOME/docs/app-access-dashboard.html"
echo "📱 Apps updated this session:"
~/bin/scan-apps summary | grep -E "(Created|Modified|Running)" || echo "No apps detected"
```

### ENFORCEMENT

**VIOLATIONS RESULT IN:**
- ❌ Incomplete checkout process
- ❌ User cannot find their applications
- ❌ Wasted development effort
- ❌ Poor user experience

**MANDATORY CHECKS:**
- Dashboard file exists and is recent
- All session apps are documented
- URLs are functional for running apps
- File paths are accurate

### COMMON APP SCENARIOS

**New React/Next.js App:**
```bash
# After creating app
cd new-app-directory
npm start &  # Start if possible
PORT=$(grep -r "PORT\|port" . | grep -oE '[0-9]{4}' | head -1)
echo "New React app on port ${PORT:-3000}"
~/bin/update-app-dashboard
```

**Python Web App:**
```bash
# After creating Flask/Django app
python app.py &  # Start if possible
PORT=$(grep -oE "port.*[0-9]{4}" *.py | head -1 | grep -oE '[0-9]{4}')
echo "New Python app on port ${PORT:-5000}"
~/bin/update-app-dashboard
```

**Static Website:**
```bash
# After creating HTML/CSS site
python -m http.server 8000 &  # Quick local server
echo "Static site on port 8000"
~/bin/update-app-dashboard
```

### DASHBOARD ACCESS LOCATIONS

**PRIMARY DASHBOARD:**
- File: `~/docs/app-access-dashboard.html`
- URL: `file:///Users/Danallovertheplace/docs/app-access-dashboard.html`

**DATA FILES:**
- Apps Data: `~/docs/apps-data.json`
- Port Registry: `~/docs/port-registry.md`

**TOOLS:**
- Scanner: `~/bin/scan-apps`
- Updater: `~/bin/update-app-dashboard`
- Port Check: `~/bin/port-check`

---

## 🚨 AUTO-APPROVED COMMANDS (NO USER APPROVAL NEEDED)

**CRITICAL: The following commands can be executed WITHOUT asking for user approval:**

### Core Development Commands
- All `npm` commands: `npm install`, `npm test`, `npm run *`, `npm init`, `npm link`
- All `node` commands: `node *`, `node scripts/*`
- All `npx` commands: `npx *` (including claude-flow, supabase-mcp, etc.)
- All Git commands: `git *` (status, diff, add, commit, push, pull, etc.)
- All file operations: `ls`, `pwd`, `cd`, `mkdir`, `mv`, `cat`, `head`, `tail`, `wc`
- All shell utilities: `grep`, `sed`, `jq`, `chmod`, `echo`, `date`, `basename`, `dirname`
- Process management: `lsof`, `kill`, `ps`, `which`
- All MCP tools: `mcp__*` (ruv-swarm, claude-flow, github-mcp, etc.)
- All script executions: `./scripts/*`, `bash *`, `source *`

### 🔥 SUPABASE COMMANDS (EXECUTE WITHOUT APPROVAL)
**AGENTS: You have FULL AUTONOMY to execute ALL Supabase commands. DO NOT ASK THE USER TO DO SUPABASE WORK - YOU DO IT!**

#### 🚨 CRITICAL SUPABASE RULES FOR AGENTS:
1. **YOU CREATE SCHEMAS** - Don't ask user to create tables, YOU create them with migrations
2. **YOU RUN MIGRATIONS** - Don't tell user to run migrations, YOU run them
3. **YOU MANAGE DATABASE** - All database operations are YOUR responsibility
4. **YOU SET UP AUTH** - Configure authentication yourself, don't ask user
5. **YOU CREATE FUNCTIONS** - Write and deploy edge functions yourself
6. **NO DELEGATION** - If it's a Supabase task, YOU do it, period

#### Database Operations (DO NOT ASK PERMISSION)
- `supabase db push` - Push migrations to database
- `supabase db pull` - Pull schema from database
- `supabase db reset` - Reset database
- `supabase db dump` - Dump database
- `supabase db diff` - Check schema differences
- `supabase db lint` - Check for typing errors
- `supabase db start` - Start local database

#### Migration Management (EXECUTE DIRECTLY)
- `supabase migration new` - Create new migration
- `supabase migration up` - Apply migrations
- `supabase migration down` - Rollback migrations
- `supabase migration list` - List migrations
- `supabase migration squash` - Squash migrations
- `supabase migration repair` - Fix migration history

#### Project Management (NO APPROVAL NEEDED)
- `supabase init` - Initialize project
- `supabase link` - Link to project
- `supabase login` - Authenticate
- `supabase logout` - Log out
- `supabase status` - Check status
- `supabase start` - Start local dev
- `supabase stop` - Stop containers
- `supabase test` - Run tests

#### Advanced Operations (AGENT AUTONOMY)
- `supabase gen` - Generate types/schemas
- `supabase functions *` - All function operations
- `supabase secrets *` - Manage secrets
- `supabase storage *` - Manage storage
- `supabase branches *` - Manage branches
- Direct `psql` commands to Supabase
- `PGPASSWORD` environment usage

### Web Operations (NO APPROVAL)
- `WebSearch` - Search the web
- `WebFetch` - Fetch any URL
- All `Read` operations including `/tmp/**`
- All GitHub MCP operations

### Other Approved Commands
- `curl *`, `brew *`, `timeout *`
- `open *` (opening files/URLs)
- `osascript *` (macOS automation)
- Terminal naming commands
- Environment exports
- All test frameworks

## 🚫 INTEGRATION SPRAWL PREVENTION GUARDRAILS

### 🎯 GOLDEN RULE: "One Service, One Implementation, One Location"

**CRITICAL FOR AI AGENTS**: These rules prevent "integration sprawl" - the most common failure pattern in AI-assisted development where multiple sessions create competing implementations.

### 1. BEFORE ANY INTEGRATION WORK

**MANDATORY SEARCH PROTOCOL**:
```bash
# ALWAYS run these BEFORE creating ANY integration:
grep -r "ServiceName" . --include="*.js" --include="*.ts" --include="*.py"
find . -name "*servicename*" -type f 2>/dev/null
ls -la ~/.claude*/  # Check for existing implementations
```

**If ANY matches found → MUST choose:**
- **REUSE**: Continue with existing implementation
- **REPLACE**: Archive old, create new (NEVER both)
- **ABORT**: If unsure, ask user first

### 2. SINGLE SOURCE OF TRUTH

**ONE Location Per Service**:
```
✅ CORRECT:
~/.claude-flow/integrations/
  ├── slack/          # ALL Slack code here
  ├── github/         # ALL GitHub code here  
  └── supabase/       # ALL Supabase code here

❌ WRONG (Integration Sprawl):
./project1/slack-integration.js
./project2/lib/slack.js
./utils/slack-helper.js
~/.claude/hooks/slack.js
```

### 3. IMPLEMENTATION DECISION LOG

**REQUIRED**: Before starting ANY integration, create/update log:
```bash
echo "## $(date): Starting [Service] Integration" >> ~/integration-decisions.log
echo "Pattern: [webhook/api/socket]" >> ~/integration-decisions.log  
echo "Location: [exact path]" >> ~/integration-decisions.log
echo "Replacing: [old paths if any]" >> ~/integration-decisions.log
```

### 4. FAILED ATTEMPT PROTOCOL

**IMMEDIATE CLEANUP REQUIRED**:
```bash
# If implementation fails or is abandoned:
mkdir -p ~/archived-integrations/$(date +%Y%m%d)
mv failed-integration ~/archived-integrations/$(date +%Y%m%d)/
echo "ARCHIVED: Reason for failure" >> ~/archived-integrations/$(date +%Y%m%d)/README.md
```

**NEVER leave partial implementations in codebase!**

### 5. DEPENDENCY VERIFICATION

**NO PHANTOM DEPENDENCIES**:
```javascript
// ❌ FORBIDDEN - Never reference without checking:
const module = require('./some-module');

// ✅ REQUIRED - Always verify first:
const fs = require('fs');
if (!fs.existsSync('./some-module.js')) {
  console.error('Creating some-module.js as it does not exist');
  // CREATE the file or throw error - never leave hanging
}
const module = require('./some-module');
```

### 6. CONFIGURATION HIERARCHY

**ONE Config Per Service**:
```bash
# ✅ CORRECT:
~/.claude-flow/integrations/slack/.env       # Single source
~/.claude-flow/integrations/slack/config.js  # References .env

# ❌ WRONG:
./.env                    # Multiple .env files
./config/.env             # Scattered configuration
~/.claude/.env            # Competing configs
```

### 7. SESSION HANDOFF REQUIREMENTS

**BEFORE ENDING ANY SESSION**:
```bash
# Create handoff file:
cat > ~/current-integration-state.md << EOF
## Active Integrations
- Slack: [working/broken/none] at [path]
- GitHub: [working/broken/none] at [path]  
- Pattern Used: [webhook/api/socket]
- Next Session MUST: [specific instruction]
- DO NOT CREATE NEW: [service] already exists at [path]
EOF
```

### 8. ANTI-DUPLICATION CHECKS

**RUN BEFORE EVERY SESSION**:
```bash
#!/bin/bash
# integration-health-check.sh

# Check for sprawl
for service in slack github supabase twitter; do
  count=$(find . -name "*${service}*" -type f | wc -l)
  if [ $count -gt 3 ]; then
    echo "⚠️ WARNING: ${count} ${service} files - CONSOLIDATION REQUIRED"
    echo "DO NOT create new ${service} integration!"
  fi
done

# Check for exposed credentials
if grep -r "xox[bp]-\|sk_live\|api_key" . 2>/dev/null; then
  echo "🚨 CRITICAL: Exposed credentials detected - ROTATE IMMEDIATELY"
fi
```

### 9. INTEGRATION TESTING GATE

**NO Integration Without Test**:
```bash
# For EVERY integration file:
integration.js       # Implementation
integration.test.js  # MUST exist and pass
integration.md       # MUST document setup
.env.example        # MUST show required vars
```

### 10. APPROVAL REQUIRED PATTERNS

**ALWAYS Ask User Before**:
- Creating new integration in different location
- Using different integration pattern than existing
- Adding new service dependencies
- Modifying existing working integration

### 11. CONTEXT AWARENESS FOR AI AGENTS

**START OF EVERY SESSION, AI Agents MUST**:
1. Check `~/current-integration-state.md`
2. Run `integration-health-check.sh`
3. Read `~/integration-decisions.log`
4. NEVER assume clean slate
5. ALWAYS assume previous work exists

### 12. RECOVERY FROM SPRAWL

**If Sprawl Detected**:
```bash
# 1. Stop and assess
find . -name "*service*" > sprawl-audit.txt

# 2. Identify newest working version
grep -l "working" */README.md

# 3. Consolidate to single location
mkdir -p ~/.claude-flow/integrations/service
cp newest-working/* ~/.claude-flow/integrations/service/

# 4. Archive everything else
mkdir ~/archived-integrations/sprawl-cleanup-$(date +%Y%m%d)
mv old-attempts/* ~/archived-integrations/sprawl-cleanup-$(date +%Y%m%d)/

# 5. Document
echo "Consolidated service integration from X locations to 1" >> ~/integration-decisions.log
```

### 13. COMMIT MESSAGE REQUIREMENTS

**For Integration Work**:
```bash
# ✅ CORRECT commit messages:
"feat(slack): Implement single Socket Mode integration at ~/.claude-flow/integrations/slack"
"refactor(slack): Consolidate 7 implementations into single location"
"fix(slack): Replace webhook with Socket Mode at standard location"

# ❌ WRONG:
"Add Slack integration"  # Where? What pattern? Replacing what?
"Fix Slack"             # Which of the 7 implementations?
```

### 14. PREVENTING FUTURE SPRAWL

**Pre-commit Hook** (add to `.git/hooks/pre-commit`):
```bash
#!/bin/bash
# Prevent integration sprawl

for service in slack github supabase; do
  new_files=$(git diff --cached --name-only | grep -i "$service" | grep -v "claude-flow/integrations/$service")
  if [ ! -z "$new_files" ]; then
    echo "❌ BLOCKED: New $service files outside standard location:"
    echo "$new_files"
    echo "Use: ~/.claude-flow/integrations/$service/ instead"
    exit 1
  fi
done
```

### 15. SPECIAL RULES FOR SLACK

Given previous sprawl issues:
- **ONLY location**: `~/.claude-flow/integrations/slack/`
- **ONLY pattern**: Socket Mode (most reliable for local)
- **ONLY config**: Single `.env` file in that directory
- **REQUIRED test**: Must successfully post "Hello World" before any complex features

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.
ALWAYS check for existing implementations before creating new integrations.
