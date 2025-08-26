#!/usr/bin/env node

/**
 * Auto-deployment script for GitHub Pages
 * Builds frontend, commits changes, and pushes to GitHub
 */

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}${colors.bold}🚀 ${msg}${colors.reset}`),
  deploy: (msg) => console.log(`${colors.magenta}${colors.bold}🌐 ${msg}${colors.reset}`)
};

class DeploymentError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.code = code;
  }
}

class GitHubPagesDeployer {
  constructor(options = {}) {
    this.options = {
      skipBuild: false,
      skipLint: false,
      force: false,
      message: null,
      ...options
    };
    this.deploymentId = Date.now().toString(36);
  }

  // Execute command with proper error handling
  exec(command, options = {}) {
    try {
      const result = execSync(command, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return result?.toString().trim();
    } catch (error) {
      throw new DeploymentError(`Command failed: ${command}\n${error.message}`, error.status);
    }
  }

  // Check if we're in a git repository
  validateGitRepo() {
    log.step('Validating Git repository...');
    
    if (!existsSync(join(PROJECT_ROOT, '.git'))) {
      throw new DeploymentError('Not in a Git repository');
    }

    // Check for uncommitted changes in critical files
    const status = this.exec('git status --porcelain', { silent: true });
    if (status && !this.options.force) {
      log.warning('Uncommitted changes detected:');
      console.log(status);
    }

    // Verify remote exists
    try {
      const remotes = this.exec('git remote -v', { silent: true });
      if (!remotes.includes('origin')) {
        throw new DeploymentError('No "origin" remote found. Please add your GitHub repository as origin.');
      }
    } catch (error) {
      throw new DeploymentError('Failed to check Git remotes');
    }

    log.success('Git repository validated');
  }

  // Build the frontend application
  async buildFrontend() {
    if (this.options.skipBuild) {
      log.warning('Skipping build (--skip-build flag)');
      return;
    }

    log.step('Building frontend application...');

    // Check if frontend directory exists
    const frontendDir = join(PROJECT_ROOT, 'frontend');
    if (!existsSync(frontendDir)) {
      throw new DeploymentError('Frontend directory not found');
    }

    // Check if package.json exists in frontend
    const packageJson = join(frontendDir, 'package.json');
    if (!existsSync(packageJson)) {
      throw new DeploymentError('Frontend package.json not found');
    }

    // Run lint if not skipped
    if (!this.options.skipLint) {
      try {
        log.info('Running linter...');
        this.exec('cd frontend && npm run lint');
        log.success('Linting passed');
      } catch (error) {
        log.warning('Linting issues found. Use --skip-lint to bypass.');
        throw error;
      }
    }

    // Build the application
    try {
      this.exec('cd frontend && npm run build');
      log.success('Frontend build completed successfully');
    } catch (error) {
      throw new DeploymentError('Frontend build failed. Please fix build errors before deploying.');
    }

    // Verify build output exists
    const distDir = join(frontendDir, 'dist');
    const indexHtml = join(distDir, 'index.html');
    
    if (!existsSync(distDir) || !existsSync(indexHtml)) {
      throw new DeploymentError('Build output not found. Build may have failed silently.');
    }

    log.success('Build verification completed');
  }

  // Generate commit message based on changes
  generateCommitMessage() {
    if (this.options.message) {
      return this.options.message;
    }

    try {
      // Get list of changed files
      const changedFiles = this.exec('git diff --cached --name-only', { silent: true });
      const allChanges = this.exec('git status --porcelain', { silent: true });
      
      if (!changedFiles && !allChanges) {
        return 'chore: Update GitHub Pages deployment';
      }

      // Analyze changes to create meaningful message
      const changes = allChanges.split('\n').filter(Boolean);
      const categories = {
        frontend: changes.filter(f => f.includes('frontend/')).length,
        backend: changes.filter(f => f.includes('backend/')).length,
        contracts: changes.filter(f => f.includes('contracts/')).length,
        docs: changes.filter(f => f.includes('docs/') || f.includes('.md')).length,
        config: changes.filter(f => f.includes('package.json') || f.includes('config')).length
      };

      let message = 'feat: Deploy updated application';
      const parts = [];

      if (categories.frontend > 0) parts.push('frontend updates');
      if (categories.backend > 0) parts.push('backend changes');
      if (categories.contracts > 0) parts.push('smart contract updates');
      if (categories.docs > 0) parts.push('documentation');
      if (categories.config > 0) parts.push('configuration');

      if (parts.length > 0) {
        message = `feat: Deploy with ${parts.join(', ')}`;
      }

      return `${message}

Automated deployment #${this.deploymentId}
Files changed: ${changes.length}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    } catch (error) {
      log.warning('Could not analyze changes for commit message');
      return `chore: Automated GitHub Pages deployment #${this.deploymentId}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
    }
  }

  // Stage and commit changes
  commitChanges() {
    log.step('Staging and committing changes...');

    // Check if there are any changes to commit
    const status = this.exec('git status --porcelain', { silent: true });
    if (!status) {
      log.warning('No changes detected. Nothing to deploy.');
      return false;
    }

    // Add all changes
    this.exec('git add .');
    
    // Verify something was staged
    const staged = this.exec('git diff --cached --name-only', { silent: true });
    if (!staged) {
      log.warning('No changes staged for commit.');
      return false;
    }

    log.info('Staged files:');
    console.log(staged.split('\n').map(f => `  ${f}`).join('\n'));

    // Create commit
    const message = this.generateCommitMessage();
    const escapedMessage = message.replace(/"/g, '\\"');
    
    try {
      this.exec(`git commit -m "${escapedMessage}"`);
      log.success('Changes committed successfully');
      return true;
    } catch (error) {
      throw new DeploymentError('Failed to commit changes');
    }
  }

  // Push to GitHub
  pushToGitHub() {
    log.step('Pushing to GitHub...');

    // Get current branch
    const branch = this.exec('git branch --show-current', { silent: true });
    log.info(`Pushing to branch: ${branch}`);

    // Check if remote branch exists
    try {
      this.exec(`git ls-remote --heads origin ${branch}`, { silent: true });
    } catch (error) {
      log.info('Remote branch does not exist. Creating...');
    }

    // Push changes
    try {
      this.exec(`git push -u origin ${branch}`);
      log.success('Successfully pushed to GitHub');
    } catch (error) {
      if (error.message.includes('rejected')) {
        log.warning('Push rejected. Attempting to pull and retry...');
        try {
          this.exec('git pull --rebase');
          this.exec(`git push -u origin ${branch}`);
          log.success('Successfully pushed after rebase');
        } catch (retryError) {
          throw new DeploymentError('Failed to push even after rebase. Please resolve conflicts manually.');
        }
      } else {
        throw new DeploymentError(`Push failed: ${error.message}`);
      }
    }
  }

  // Get GitHub Pages URL
  getGitHubPagesUrl() {
    try {
      const remoteUrl = this.exec('git config --get remote.origin.url', { silent: true });
      
      // Extract username and repo name from various URL formats
      let match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        const [, username, repo] = match;
        return `https://${username}.github.io/${repo}/`;
      }
      
      return 'Your GitHub Pages site (check repository settings)';
    } catch (error) {
      return 'Your GitHub Pages site';
    }
  }

  // Create deployment summary
  createDeploymentSummary() {
    const summary = {
      deploymentId: this.deploymentId,
      timestamp: new Date().toISOString(),
      gitCommit: this.exec('git rev-parse HEAD', { silent: true }),
      branch: this.exec('git branch --show-current', { silent: true }),
      url: this.getGitHubPagesUrl()
    };

    const summaryPath = join(PROJECT_ROOT, '.deployment-summary.json');
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    return summary;
  }

  // Main deployment process
  async deploy() {
    const startTime = Date.now();
    
    try {
      log.deploy('🚀 Starting GitHub Pages deployment...');
      console.log('');

      // Validation
      this.validateGitRepo();
      
      // Build
      await this.buildFrontend();
      
      // Commit changes
      const hasChanges = this.commitChanges();
      if (!hasChanges) {
        log.warning('No changes to deploy. Exiting.');
        return;
      }
      
      // Push to GitHub
      this.pushToGitHub();
      
      // Create summary
      const summary = this.createDeploymentSummary();
      
      // Success message
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('');
      log.deploy('🎉 Deployment completed successfully!');
      console.log('');
      log.success(`✨ Site URL: ${summary.url}`);
      log.success(`⏱️  Duration: ${duration}s`);
      log.success(`🔗 Commit: ${summary.gitCommit.substring(0, 7)}`);
      console.log('');
      log.info('🕒 GitHub Pages may take 5-10 minutes to update');
      log.info('📊 Check deployment status at: https://github.com/{username}/{repo}/deployments');
      
    } catch (error) {
      console.log('');
      log.error('💥 Deployment failed!');
      log.error(error.message);
      
      if (error.code) {
        process.exit(error.code);
      }
      process.exit(1);
    }
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    skipBuild: false,
    skipLint: false,
    force: false,
    message: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--skip-lint':
        options.skipLint = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '-m':
      case '--message':
        options.message = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${colors.bold}GitHub Pages Auto-Deployment Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/deploy-to-github-pages.js [options]

${colors.cyan}Options:${colors.reset}
  --skip-build    Skip the frontend build process
  --skip-lint     Skip linting before build
  --force         Deploy even with uncommitted changes
  -m, --message   Custom commit message
  -h, --help      Show this help message

${colors.cyan}Examples:${colors.reset}
  node scripts/deploy-to-github-pages.js
  node scripts/deploy-to-github-pages.js --skip-lint
  node scripts/deploy-to-github-pages.js -m "feat: Add new donation form"
  node scripts/deploy-to-github-pages.js --force --skip-build

${colors.cyan}What this script does:${colors.reset}
  1. ✅ Validates Git repository
  2. 🔧 Builds frontend application
  3. 🧹 Runs linter (unless --skip-lint)
  4. 📝 Stages and commits changes
  5. 🚀 Pushes to GitHub
  6. 🌐 Triggers GitHub Pages deployment

${colors.yellow}Note:${colors.reset} GitHub Pages may take 5-10 minutes to reflect changes.
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const deployer = new GitHubPagesDeployer(options);
  deployer.deploy();
}

export { GitHubPagesDeployer };