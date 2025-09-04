# 🛡️ Platform Ownership Rules

This project enforces strict boundaries between different development platforms to prevent conflicts and maintain code integrity.

## 📁 Folder Structure & Ownership

### 🎯 Claude Code (Full Access)

**Primary Platform for Frontend Development & Configuration**

**Allowed:**

```
frontend/          # React app, components, main logic
shared/            # Cross-platform shared resources
scripts/           # Automation and build scripts
*.md               # Documentation
*.json             # Configuration files
*.sh               # Shell scripts
.gitignore         # Git configuration
.platform-rules   # This rules file
CHANGELOG.md       # Version history
VERSIONING.md      # Version documentation
```

**Responsibilities:**

- Main React application development
- Build system and automation
- Release management and versioning
- Cross-platform coordination
- Documentation maintenance

---

### 🎨 Lovable (Design-Focused)

**UI/UX Design Platform**

**Allowed:**

```
lovable/                # Lovable-specific design files
shared/components/      # Reusable React components
shared/styles/          # CSS, styling, themes
```

**Restricted:**

```
❌ frontend/           # Main app logic (coordinate with Claude Code)
❌ contracts/          # Smart contracts (use Replit)
❌ scripts/            # Build automation (use Claude Code)
```

**Responsibilities:**

- UI/UX design and prototyping
- Reusable component design
- Styling and theming
- Design system maintenance

---

### ⚡ Replit (Smart Contracts)

**Smart Contract Development Platform**

**Allowed:**

```
contracts/              # Smart contract source and deployment
shared/types/           # TypeScript contract interfaces
shared/interfaces/      # Cross-platform type definitions
```

**Restricted:**

```
❌ frontend/           # React app (coordinate with Claude Code)
❌ lovable/            # Design files (use Lovable)
❌ scripts/            # Build scripts (use Claude Code)
```

**Responsibilities:**

- Smart contract development
- Contract testing and deployment
- Blockchain integration
- Contract interface definitions

---

### 🤝 Shared Resources (All Platforms)

**Accessible by All Platforms (Coordinate Changes)**

```
shared/
├── types/             # TypeScript definitions
├── interfaces/        # API and contract interfaces
├── components/        # Reusable React components
├── styles/            # Global styling and themes
└── utils/             # Cross-platform utilities
```

**Rules:**

- Any platform can read shared files
- Changes should be coordinated between platforms
- Use clear commit messages for shared changes

---

## 🚨 Automated Enforcement

### Git Hooks Protection

- **Pre-commit Hook**: Prevents commits that violate platform boundaries
- **Post-commit Hook**: Monitors and reports platform activity
- **Automatic Warnings**: Alerts when boundaries are crossed

### Boundary Checking

```bash
# Check current platform boundaries
npm run check-boundaries

# View platform status
npm run platform-status

# View platform activity log
./scripts/check-boundaries.sh activity
```

## 🔍 Platform Detection

The system automatically detects your current platform:

| Platform        | Detection Method                                 |
| --------------- | ------------------------------------------------ |
| **Lovable**     | `LOVABLE_ENV` or `LOVABLE` environment variables |
| **Replit**      | `REPLIT` or `REPL_ID` environment variables      |
| **Claude Code** | Local development (default)                      |

## ⚠️ Boundary Violations

### What Triggers Warnings:

- Lovable modifying `frontend/` or `contracts/`
- Replit modifying `frontend/` or `lovable/`
- Any platform modifying protected config files

### Override Emergency Access:

```bash
# Only use in emergencies - bypasses boundary checks
git commit --no-verify -m "Emergency fix: description"
```

## 🔄 Recommended Workflows

### Starting Work (Any Platform)

```bash
# Always pull latest changes first
./sync-start.sh

# Check your platform permissions
npm run platform-status
```

### Making Changes

```bash
# Work in your designated folders
# Commit changes
git add .
git commit -m "feat: your changes"

# Boundary check runs automatically
# Push changes
./sync-save.sh
```

### Cross-Platform Coordination

```bash
# Before major changes affecting multiple platforms
./scripts/check-boundaries.sh activity

# Coordinate through shared/ folder when possible
# Use clear commit messages indicating platform coordination
```

## 🛠️ Platform-Specific Commands

### Claude Code

```bash
npm run dev                    # Start development server
npm run build                  # Build for production
npm run release                # Create new release
./scripts/version.sh major     # Bump major version
```

### Lovable

```bash
# Work in lovable/ folder
# Focus on shared/components/ and shared/styles/
./sync-start.sh               # Pull latest before work
./sync-save.sh                # Push when done
```

### Replit

```bash
# Work in contracts/ folder
# Use shared/types/ for interfaces
# Test contracts before committing
./sync-start.sh               # Pull latest before work
./sync-save.sh                # Push when done
```

## 📊 Monitoring & Reports

### Activity Tracking

- All commits are logged with platform information
- Platform activity is tracked in `.git/platform-activity.log`
- Boundary violations are logged and reported

### Regular Health Checks

```bash
# Daily boundary check
./scripts/check-boundaries.sh

# Weekly activity review
./scripts/check-boundaries.sh activity

# Generate detailed report
./scripts/check-boundaries.sh report
```

## 🚫 Common Violations & Solutions

### ❌ Lovable modifying frontend/ files

**Solution:** Move UI components to `lovable/` or `shared/components/`

### ❌ Replit modifying frontend/ files

**Solution:** Use `shared/types/` for contract interfaces, coordinate with Claude Code for frontend integration

### ❌ Any platform modifying scripts/

**Solution:** Request changes through Claude Code platform

### ❌ Direct config file modifications

**Solution:** Use Claude Code for configuration changes, or coordinate through issues/PRs

## 💡 Best Practices

1. **Always sync before starting work:** `./sync-start.sh`
2. **Work in your designated folders** for primary development
3. **Use shared/ folder** for cross-platform resources
4. **Coordinate major changes** through clear communication
5. **Respect platform expertise** - leverage each platform's strengths
6. **Monitor boundary health** with regular checks
7. **Use meaningful commit messages** that indicate platform and purpose

## 🔗 Integration with Existing Tools

### Versioning System

- Platform boundaries integrate with automated versioning
- Release process respects platform ownership
- Changelog generation includes platform attribution

### Multi-Platform Sync

- Boundary checks run with sync scripts
- Platform detection works with sync automation
- Conflict resolution respects platform ownership

---

_This system ensures clean separation of concerns while maintaining seamless collaboration across all development platforms._ 🚀
