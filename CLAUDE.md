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

### Behavior Examples:

| ❌ NEVER SAY | ✅ ALWAYS DO |
|-------------|-------------|
| "You'll need to create a table..." | "I'll create the schema now..." |
| "Please run `supabase db push`..." | "Running `supabase db push`..." |
| "Set up authentication by..." | "Setting up authentication..." |
| "The user should configure..." | "Configuring the service..." |
| "Ask me for credentials..." | "I need your API key..." (for secrets only) |

### SUPABASE-SPECIFIC AUTONOMY:
**Schemas** • **Migrations** • **Auth** • **Storage** • **Functions** • **Testing** - Do everything yourself

## 🚫 CRITICAL: TEST EMAIL POLICY

### PUPPETEER & AUTOMATED TESTING EMAIL REQUIREMENT

**ALL agents MUST use ONLY this email for testing:**
```
test@dkdev.io
```

**NEVER USE:**
- ❌ Fake emails with timestamps: `test-${Date.now()}@example.com`
- ❌ Random email generators or faker libraries
- ❌ Any @test.com, @example.com, @gmail.com test addresses
- ❌ Dynamically generated email addresses

**WHY:** Using multiple fake emails causes Supabase authentication failures and email verification issues.

**ENFORCEMENT:** Any test using non-approved emails = IMMEDIATE TASK FAILURE

## 🗄️ CRITICAL: DATA INTEGRATION PREVENTION GUARDRAILS

### MANDATORY DATA INTEGRATION PROTOCOL

**ABSOLUTE RULE: NO DATA CREATION WITHOUT INTEGRATION PROOF**

#### 🚨 BEFORE CREATING ANY DATA, AGENTS MUST:

1. **Check Existing Data Sources First**
   ```bash
   # Search for existing data
   find . -name "*.db" -o -name "*.csv" -o -name "*test*data*" | grep -v node_modules
   ```

2. **Create Integration Plan BEFORE Data Generation**
   - Document target system (Supabase table name)
   - Verify target tables exist or create them first
   - Write import script before generating data
   - Test with small batch (10-50 records) first

3. **Schema-First Approach - NO EXCEPTIONS**
   - Database tables MUST exist before data generation
   - Generated data MUST match existing schema exactly
   - Test import immediately with sample records
   - No data generation without confirmed target tables

#### 📋 MANDATORY INTEGRATION CHECKLIST

**EVERY agent creating data MUST complete ALL steps:**

```markdown
□ Target database tables exist and accessible
□ Import script written and tested with sample data
□ Full integration pipeline tested end-to-end
□ Data successfully queryable in target system
□ Clear documentation created for next agent
□ No orphaned files (CSV without import, DB without connection)
```

#### 🔄 INTEGRATION-FIRST WORKFLOW

**REQUIRED SEQUENCE:**
1. **Create/verify target tables** in Supabase
2. **Generate small test batch** (10-50 records)
3. **Create import script** and test with batch
4. **Verify data accessible** via target system queries
5. **Generate full dataset** only after successful test
6. **Import immediately** - no delays
7. **Verify final import** with count and sample queries
8. **Document process** for next agent

#### ❌ PROHIBITED ACTIONS

**IMMEDIATE TASK FAILURE for:**
- Creating data without integration plan
- Generating CSV files without import scripts
- Creating SQLite databases without Supabase connection
- Exporting data without verifying import works
- Ending session with orphaned data sources
- Creating migration files that are never applied

#### 🎯 INTEGRATION TESTING REQUIREMENTS

**For ANY data generation, MUST prove integration works:**
```javascript
// MANDATORY: Prove the data actually works
async function validateDataIntegration() {
  // 1. Generate test data
  // 2. Import to target system  
  // 3. Query target system
  // 4. Verify data accessible and correct
  // 5. Document the process
}
```

#### 📝 SESSION HANDOFF PROTOCOL

**BEFORE ending any data-related session, MUST create:**
- `DATA_INTEGRATION_GUIDE.md` - How to use the generated data
- Working import script with examples
- Schema documentation
- Verification that next agent can continue seamlessly

#### 🧹 DATA LIFECYCLE MANAGEMENT

**All temporary data files MUST have clear lifecycle:**
- `*.db` files → Integrate to Supabase or delete after successful import
- `*-export.csv` → MUST have corresponding working import script
- `*-test-data.*` → MUST be integrated or explicitly marked as throwaway

#### 🚫 ENFORCEMENT

**DATA INTEGRATION VIOLATIONS:**
- 1st violation: Warning + immediate correction required
- 2nd violation: Task termination + process review
- 3rd violation: Agent replacement + data audit

**No exceptions. No orphaned data. No "I'll integrate it later."**

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

| Type | Command | Description |
|------|---------|-------------|
| **Core** | `npx claude-flow sparc modes` | List available modes |
| | `npx claude-flow sparc run <mode> "<task>"` | Execute specific mode |
| | `npx claude-flow sparc tdd "<feature>"` | Run complete TDD workflow |
| | `npx claude-flow sparc info <mode>` | Get mode details |
| **Batch** | `npx claude-flow sparc batch <modes> "<task>"` | Parallel execution |
| | `npx claude-flow sparc pipeline "<task>"` | Full pipeline processing |
| | `npx claude-flow sparc concurrent <mode> "<tasks-file>"` | Multi-task processing |
| **Build** | `npm run build` | Build project |
| | `npm run test` | Run tests |
| | `npm run lint` | Linting |
| | `npm run typecheck` | Type checking |

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

| Category | Agents |
|----------|--------|
| **Core** | `coder`, `reviewer`, `tester`, `planner`, `researcher` |
| **Swarm** | `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager` |
| **Consensus** | `byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager` |
| **Performance** | `perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent` |
| **GitHub** | `github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm` |
| **SPARC** | `sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement` |
| **Specialized** | `backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator` |
| **Testing** | `tdd-london-swarm`, `production-validator` |
| **Migration** | `migration-planner`, `swarm-init` |

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

| Category | Tools |
|----------|-------|
| **Coordination** | `swarm_init`, `agent_spawn`, `task_orchestrate` |
| **Monitoring** | `swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results` |
| **Memory & Neural** | `memory_usage`, `neural_status`, `neural_train`, `neural_patterns` |
| **GitHub** | `github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review` |
| **System** | `benchmark_run`, `features_detect`, `swarm_monitor` |

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

⚡ **Parallel Execution** • 🧠 **Neural Training** • 📊 **Bottleneck Analysis** • 🤖 **Smart Auto-Spawning** • 🛡️ **Self-Healing** • 💾 **Cross-Session Memory** • 🔗 **GitHub Integration**

## Integration Tips

**Setup** → Scale agents → Use memory → Monitor progress → Train patterns → Enable hooks → Use GitHub tools

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

### CHECKOUT PROTOCOL

| Step | Actions |
|------|--------|
| **Git** | Check status → stage → commit → push → verify |
| **Review** | Scan TODOs, console.logs, incomplete code |
| **Apps** | Update dashboard, scan ports, ensure access |

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

| **Docs** | Session summary, decisions, git links, app access |
| **CTO** | Resource summary, strategic decisions, coordination data |
| **Prep** | Document context, restoration info, next steps |
| **Verify** | GitHub ✅ Docs ✅ CTO ✅ Dashboard ✅ Access ✅ |

**Completion**: Say "checkout completed." when done.

## 🚀 PROJECT STARTUP COMMAND

When user says "startup [project-name]" or just "startup", execute complete project initialization protocol:

### STARTUP PROTOCOL

| Step | Actions |
|------|--------|
| **Project** | Identify → load context → restore state → check health |
| **CTO** | Connect Pachacuti → get priorities → check conflicts |
| **Agents** | Spawn project manager → load context → init workflows |
| **Environment** | git pull → check deps → verify setup → init services |
| **Context** | Load summary → review progress → identify priorities |
| **Coordination** | Setup communication → reporting → approvals → tracking |
| **Ready** | Confirm operational → verify agents → display status |

**Completion**: Say "Start up complete, ready to work." when done.

## 🚫 PORT CONFLICT PREVENTION GUARDRAILS

### 🔴 ABSOLUTE REQUIREMENT: "CHECK BEFORE BIND"

🚨 **AGENTS MUST**: Check port availability before starting ANY service.

### PORT CHECK PROTOCOL

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

### PORT ALLOCATION

| Range | Purpose | Protocol |
|-------|---------|----------|
| 3000-3099 | Frontend (React, Next.js) | Check registry → assign → update → commit |
| 3100-3199 | Backend APIs | Same protocol |
| 3200-3299 | Microservices | Same protocol |
| 5000-5099 | Alt backends | Same protocol |
| 5170-5199 | Vite dev servers | Same protocol |
| 8000-8099 | Python/Django | Same protocol |
| 8500-8599 | Blockchain/Web3 | Same protocol |

### ENFORCEMENT

**VIOLATIONS** → Task termination, error report, fix required, violation logged

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

| Example | Code |
|---------|------|
| **❌ Bad** | `app.listen(3000)` - No port checking |
| **✅ Good** | `const PORT = await checkPort(3000); app.listen(PORT)` |

## 📊 APP ACCESS TRACKING GUARDRAILS

### 🎯 APP ACCESS TRACKING

🚨 **AGENTS MUST**: Update app access dashboard after creating/modifying any application.

### MANDATORY APP ACCESS PROTOCOL

**AFTER CREATING/MODIFYING ANY APPLICATION:**

```bash
# STEP 1: UPDATE PROJECT STATUS (NON-NEGOTIABLE)
project-status

# STEP 2: UPDATE APP STRUCTURE GUIDE
echo "Last Updated: $(date)" >> docs/APP_STRUCTURE_GUIDE.md
echo "Agent: $(whoami)" >> docs/APP_STRUCTURE_GUIDE.md

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
- Status Check: `project-status`
- Onboarding: `agent-onboard`
- Structure Guide: `docs/APP_STRUCTURE_GUIDE.md`

---

## 🚨 AUTO-APPROVED COMMANDS (NO USER APPROVAL NEEDED)

**CRITICAL: The following commands can be executed WITHOUT asking for user approval:**

| Category | Commands | Examples |
|----------|----------|----------|
| **npm/node** | `npm *`, `node *`, `npx *` | install, test, run, init, scripts |
| **Git** | `git *` | status, diff, add, commit, push, pull |
| **File Ops** | `ls`, `pwd`, `cd`, `mkdir`, `mv`, file utils | cat, head, tail, wc |
| **Shell Utils** | `grep`, `sed`, `jq`, `chmod` | echo, date, basename, dirname |
| **Process** | `lsof`, `kill`, `ps`, `which` | Process management |
| **MCP** | `mcp__*` | ruv-swarm, claude-flow, github-mcp |
| **Scripts** | `./scripts/*`, `bash *`, `source *` | All script executions |

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

🚨 **AGENTS MUST**: Prevent "integration sprawl" - competing implementations across sessions.

### INTEGRATION WORKFLOW

| Step | Action | Command/Rule |
|------|--------|-------------|
| **1. Search** | Check existing | `grep -r "ServiceName" . --include="*.js"` |
| **2. Decide** | REUSE/REPLACE/ABORT | Never create competing implementations |
| **3. Location** | Single source | `~/.claude-flow/integrations/[service]/` |
| **4. Log** | Document decision | `echo "$(date): [Service]" >> ~/integration-decisions.log` |
| **5. Cleanup** | Archive failures | `mv failed → ~/archived-integrations/$(date)` |

### DEPENDENCY VERIFICATION

**Rule**: Always verify files exist before requiring them. Create missing files, never leave hanging references.

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
