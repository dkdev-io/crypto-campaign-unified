# 🔢 Versioning System Documentation

This project uses a flexible automated versioning system that supports both semantic versioning and custom feature-based releases.

## 🚀 Quick Start

### Automatic Semantic Versioning
```bash
# Bug fixes (1.0.0 → 1.0.1)
npm run version:patch

# New features (1.0.0 → 1.1.0)  
npm run version:minor

# Breaking changes (1.0.0 → 2.0.0)
npm run version:major
```

### Custom Feature Releases
```bash
# Interactive custom versioning
npm run version:custom

# Examples:
# v2.0.0-crypto-ready
# v1.5.0-mobile-support
# v3.0.0-beta
```

### Complete Release Workflow
```bash
# Full automated release process
npm run release

# Specific release types
./scripts/release.sh patch
./scripts/release.sh feature
./scripts/release.sh hotfix
```

## 📋 Available Scripts

### Version Management (`./scripts/version.sh`)
| Command | Description | Example |
|---------|-------------|---------|
| `./scripts/version.sh patch` | Bug fixes | 1.0.0 → 1.0.1 |
| `./scripts/version.sh minor` | New features | 1.0.0 → 1.1.0 |
| `./scripts/version.sh major` | Breaking changes | 1.0.0 → 2.0.0 |
| `./scripts/version.sh custom` | Interactive custom | v2.0.0-crypto-ready |

### Changelog Generation (`./scripts/changelog.sh`)
| Command | Description |
|---------|-------------|
| `./scripts/changelog.sh auto` | Generate changelog for unreleased changes |
| `./scripts/changelog.sh full` | Regenerate complete changelog from all tags |
| `./scripts/changelog.sh custom` | Interactive custom changelog |

### Release Management (`./scripts/release.sh`)
| Command | Description |
|---------|-------------|
| `./scripts/release.sh patch` | Automated patch release |
| `./scripts/release.sh minor` | Automated minor release |
| `./scripts/release.sh major` | Automated major release |
| `./scripts/release.sh feature` | Custom feature release |
| `./scripts/release.sh hotfix` | Emergency hotfix release |
| `./scripts/release.sh` | Interactive mode |

## 🏷️ Tag Examples

### Standard Semantic Tags
- `v1.0.0` - Initial release
- `v1.0.1` - Patch release
- `v1.1.0` - Minor release
- `v2.0.0` - Major release

### Feature-Based Tags
- `v2.0.0-crypto-ready` - Crypto functionality complete
- `v1.5.0-mobile-support` - Mobile responsive features
- `v3.0.0-beta` - Beta release for testing
- `v1.2.0-security-updates` - Security-focused release
- `v2.1.0-performance` - Performance improvements

## 📝 Automatic Changelog

The system automatically generates changelogs with:

### Commit Categorization
- ✨ **New Features** - `feat:` commits
- 🐛 **Bug Fixes** - `fix:` commits  
- 📚 **Documentation** - `docs:` commits
- 🎨 **Styling** - `style:` commits
- ♻️ **Refactoring** - `refactor:` commits
- ⚡ **Performance** - `perf:` commits
- 🧪 **Tests** - `test:` commits
- 👷 **CI/CD** - `ci:` commits
- 🔧 **Maintenance** - `chore:` commits
- 💥 **Breaking Changes** - `BREAKING:` or `breaking:` commits

### Features
- **GitHub Links** - Direct links to commits
- **Conventional Commits** - Supports conventional commit format
- **Keyword Detection** - Automatically categorizes commits by keywords
- **Date Tracking** - Includes release dates
- **Version Comparison** - Shows changes between versions

## 🔄 Complete Release Workflow

### 1. Automated Release Process
```bash
# Run the complete release workflow
./scripts/release.sh minor
```

This will:
1. ✅ Run pre-release checks (git status, tests, build)
2. 📈 Bump version in package.json
3. 📝 Generate/update changelog
4. 🏷️ Create git tag with release notes
5. 📤 Push changes and tags to GitHub
6. 🎉 Create GitHub release

### 2. Feature Release Process
```bash
# Interactive feature release
./scripts/release.sh feature
```

Example flow:
```
Enter version (x.y.z): 2.0.0
Enter feature name: crypto-ready

Result: v2.0.0-crypto-ready
```

### 3. Hotfix Release Process
```bash
# Emergency hotfix
./scripts/release.sh hotfix
```

Automatically bumps patch version and marks as critical fix.

## 🛠️ Advanced Usage

### Custom Version Examples
```bash
# Set specific version
./scripts/version.sh custom
# Choose option 1, enter: 2.1.0

# Create feature version
./scripts/version.sh custom  
# Choose option 2, enter version: 2.0.0, feature: crypto-ready
```

### Manual Changelog Generation
```bash
# Generate changelog for current unreleased changes
./scripts/changelog.sh auto

# Regenerate complete changelog from git history
./scripts/changelog.sh full

# Custom changelog for specific range
./scripts/changelog.sh custom
```

## 🔍 Pre-Release Checks

The release system automatically runs:

1. **Git Status Check** - Ensures clean working directory
2. **Branch Validation** - Warns if not on main/master
3. **Remote Sync** - Fetches latest changes and checks if behind
4. **Test Execution** - Runs `npm test` if available
5. **Build Verification** - Runs `npm run build` if available

## 🏗️ Integration with Multi-Platform Sync

The versioning system integrates with your existing sync workflow:

```bash
# Before making changes
./sync-start.sh

# After implementing features
./scripts/release.sh minor

# Automatically syncs with GitHub and all platforms
```

## 📋 Best Practices

### Commit Message Format
Use conventional commits for best categorization:
```bash
feat: add crypto payment integration
fix: resolve donation form validation
docs: update API documentation
style: improve mobile responsiveness
refactor: optimize form submission logic
perf: reduce bundle size
test: add unit tests for payment flow
ci: update deployment pipeline
chore: update dependencies
```

### Feature Naming Conventions
- Use kebab-case: `crypto-ready`, `mobile-support`
- Be descriptive: `security-updates`, `performance-boost`
- Include stage for prereleases: `beta`, `alpha`, `rc1`

### Version Strategy
- **Patch (x.y.Z)** - Bug fixes, security patches
- **Minor (x.Y.z)** - New features, backward compatible
- **Major (X.y.z)** - Breaking changes, API changes
- **Feature** - Milestone releases, major feature sets

## 🔗 GitHub Integration

Requires GitHub CLI for automatic release creation:
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Now releases will be automatically created on GitHub
```

## 📊 Example Workflow

```bash
# 1. Start working
./sync-start.sh

# 2. Make changes and commit
git add .
git commit -m "feat: add crypto wallet integration"

# 3. Create feature release
./scripts/release.sh feature
# Enter: version=2.0.0, feature=crypto-ready

# 4. Result: v2.0.0-crypto-ready with full automation
```

This creates:
- ✅ Updated package.json (v2.0.0)
- ✅ Git tag (v2.0.0-crypto-ready) 
- ✅ Updated CHANGELOG.md
- ✅ GitHub release
- ✅ Multi-platform sync

---

*Generated by the Crypto Campaign Setup versioning system* 🚀