# 🚀 Deployment Guide

Complete guide for deploying the Crypto Campaign application to GitHub Pages with automated workflows.

## 📋 Overview

This project includes multiple deployment options:

1. **Manual Deployment** - One-time deployment script
2. **Watch Mode** - Automatic deployment on file changes
3. **GitHub Actions** - CI/CD pipeline with testing and deployment
4. **Local Development** - Hot-reload for development

## 🎯 Quick Start

### Deploy Now (One Command)

```bash
npm run deploy
```

### Watch for Changes (Auto-Deploy)

```bash
npm run deploy:watch
```

## 📚 Deployment Options

### 1. Manual Deployment

Perfect for controlled deployments after making changes:

```bash
# Full deployment with all checks
npm run deploy

# Quick deployment (skip linting)
npm run deploy:quick

# Force deployment (ignore git warnings)
npm run deploy:force

# Custom commit message
node scripts/deploy-to-github-pages.js -m "feat: Add new donation form"
```

**What it does:**

- ✅ Validates Git repository
- 🔧 Builds frontend application
- 🧹 Runs linter (unless --skip-lint)
- 📝 Stages and commits changes
- 🚀 Pushes to GitHub
- 🌐 Triggers GitHub Pages deployment

### 2. Watch Mode (Auto-Deploy)

Automatically deploys when you save changes:

```bash
# Start watching (default settings)
npm run deploy:watch

# Fast watching (skip linting, 3s debounce)
npm run deploy:watch-fast

# Custom settings
node scripts/watch-and-deploy.js --debounce 10 --cooldown 120
```

**Features:**

- 👀 Watches source files for changes
- ⏱️ Debounces changes (default: 5s)
- 🚀 Auto-builds and deploys
- ⏳ Cooldown period prevents spam (default: 60s)
- 🔄 Continues watching after deployment

**Watched Files:**

- JavaScript/React (`.js`, `.jsx`, `.ts`, `.tsx`)
- Styles (`.css`, `.scss`, `.sass`)
- HTML and JSON files
- Documentation (`.md`)
- Smart contracts (`.sol`)

### 3. GitHub Actions (CI/CD)

Automated deployment triggered by pushes to main branch:

**Triggers:**

- ✅ Push to `main` branch
- ✅ Manual workflow dispatch
- ✅ Changes in `frontend/`, `backend/`, `contracts/`

**What it does:**

- 🧪 Runs all tests and linting
- 🔨 Builds application
- 📊 Performance monitoring (Lighthouse)
- 🛡️ Security audits
- 🚀 Deploys to GitHub Pages
- ✅ Verifies deployment

**Manual Trigger:**

1. Go to `Actions` tab in GitHub
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"
4. Choose options and run

### 4. Local Development

For development with hot-reload:

```bash
# Start all services
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## 🛠️ Configuration

### GitHub Pages Setup

1. **Repository Settings:**
   - Go to Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/ (root)`

2. **Required Files:** ✅ Already created
   - `index.html` (redirects to frontend)
   - `.nojekyll` (prevents Jekyll processing)

### Watch Mode Settings

```bash
# Available options
--debounce <seconds>   # Wait time after changes (default: 5)
--cooldown <seconds>   # Min time between deploys (default: 60)
--skip-build          # Skip build process
--skip-lint           # Skip linting
--watch-paths <paths> # Custom paths to watch
```

### GitHub Actions Environment

The workflow supports:

- **Environment Variables:** Automatically set
- **Manual Triggers:** With environment selection
- **Artifact Storage:** Build outputs saved for 30 days
- **Performance Monitoring:** Lighthouse CI integration

## 📊 Monitoring & Verification

### Deployment Status

```bash
# Check last deployment
cat .deployment-summary.json

# View GitHub Pages status
gh api repos/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/pages

# Test site accessibility
curl -I https://yourusername.github.io/your-repo/
```

### Performance Monitoring

After deployment, Lighthouse CI runs automatically and provides:

- Performance scores
- Accessibility checks
- Best practices audit
- SEO analysis

View reports in GitHub Actions artifacts.

## 🚨 Troubleshooting

### Common Issues

**1. Build Failures**

```bash
# Fix linting issues
npm run lint:fix

# Check build locally
cd frontend && npm run build
```

**2. Git Push Rejected**

```bash
# Pull latest changes
git pull --rebase

# Retry deployment
npm run deploy
```

**3. GitHub Pages Not Updating**

- Check Actions tab for deployment status
- Wait 5-10 minutes for propagation
- Verify Pages settings in repository

**4. Watch Mode Issues**

```bash
# Check what's being watched
node scripts/watch-and-deploy.js --help

# Kill existing watchers
pkill -f "watch-and-deploy"
```

### Getting Help

**Deployment Logs:**

```bash
# Detailed deployment with verbose output
node scripts/deploy-to-github-pages.js --help

# Watch mode help
node scripts/watch-and-deploy.js --help
```

**GitHub Actions Logs:**

1. Go to repository Actions tab
2. Click on failed workflow
3. Expand failed step for details

## 🔧 Advanced Usage

### Custom Deployment Scripts

Create your own deployment script:

```javascript
import { GitHubPagesDeployer } from './scripts/deploy-to-github-pages.js';

const deployer = new GitHubPagesDeployer({
  skipBuild: false,
  skipLint: true,
  message: 'Custom deployment message',
});

await deployer.deploy();
```

### Webhooks Integration

For external triggers, use GitHub webhooks:

```bash
# Trigger deployment via webhook
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/USERNAME/REPO/dispatches \
  -d '{"event_type":"deploy"}'
```

## 📈 Performance Tips

1. **Faster Builds:**
   - Use `--skip-lint` during development
   - Enable build caching in CI
   - Optimize frontend bundle size

2. **Efficient Watching:**
   - Increase debounce for active development
   - Use selective path watching
   - Adjust cooldown based on needs

3. **Better Deployment:**
   - Commit related changes together
   - Use meaningful commit messages
   - Test locally before deploying

## 🎯 Site URLs

After successful deployment:

- **Production:** https://cryptocampaign.netlify.app
- **Build Info:** https://cryptocampaign.netlify.app/build-info.json

## 📝 Deployment Checklist

Before deploying:

- [ ] All tests pass locally
- [ ] Linting passes
- [ ] Build completes successfully
- [ ] No sensitive data in code
- [ ] Commit messages are clear

After deploying:

- [ ] Site loads correctly
- [ ] All features work as expected
- [ ] Performance is acceptable
- [ ] No console errors

---

## 🤖 Automated with Claude Code

This deployment system was created and optimized using [Claude Code](https://claude.ai/code) for maximum reliability and developer experience.
