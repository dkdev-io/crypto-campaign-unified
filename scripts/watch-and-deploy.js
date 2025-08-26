#!/usr/bin/env node

/**
 * Watch mode deployment script
 * Watches for file changes and automatically deploys to GitHub Pages
 */

import { watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GitHubPagesDeployer } from './deploy-to-github-pages.js';

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
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  watch: (msg) => console.log(`${colors.magenta}👀 ${msg}${colors.reset}`),
  deploy: (msg) => console.log(`${colors.cyan}${colors.bold}🚀 ${msg}${colors.reset}`),
  dim: (msg) => console.log(`${colors.dim}   ${msg}${colors.reset}`)
};

class DeploymentWatcher {
  constructor(options = {}) {
    this.options = {
      debounceMs: 5000,    // Wait 5 seconds after last change
      cooldownMs: 60000,   // Minimum 1 minute between deployments
      skipBuild: false,
      skipLint: false,
      autoCommit: true,
      watchPaths: ['frontend/src', 'frontend/public', 'backend/src'],
      ignorePaths: ['node_modules', '.git', 'dist', 'build', '.next'],
      ...options
    };
    
    this.watchers = [];
    this.deploymentQueue = null;
    this.lastDeployment = 0;
    this.isDeploying = false;
    this.changeCounter = 0;
  }

  // Check if path should be ignored
  shouldIgnore(filePath) {
    return this.options.ignorePaths.some(ignore => 
      filePath.includes(ignore) || 
      filePath.includes(`/${ignore}/`) ||
      filePath.includes(`\\${ignore}\\`)
    );
  }

  // Check if file type should trigger deployment
  shouldTriggerDeployment(filePath) {
    const deployTriggers = [
      '.jsx', '.js', '.ts', '.tsx',     // React/JS files
      '.css', '.scss', '.sass',         // Styles
      '.html', '.json',                 // Config/HTML
      '.md',                            // Documentation
      '.sol',                           // Smart contracts
      '.env.example'                    // Environment examples
    ];

    const ignoreTriggers = [
      '.test.', '.spec.',               // Test files
      '.log', '.cache',                 // Temporary files
      'package-lock.json',              // Lock files
      '.DS_Store'                       // System files
    ];

    // Check if should ignore
    if (ignoreTriggers.some(ignore => filePath.includes(ignore))) {
      return false;
    }

    // Check if has trigger extension
    return deployTriggers.some(ext => filePath.endsWith(ext));
  }

  // Handle file change event
  handleChange(eventType, filename, watchPath) {
    if (!filename) return;

    const fullPath = join(watchPath, filename);
    
    // Skip ignored paths
    if (this.shouldIgnore(fullPath)) {
      return;
    }

    // Skip if doesn't trigger deployment
    if (!this.shouldTriggerDeployment(filename)) {
      log.dim(`Ignoring: ${filename}`);
      return;
    }

    this.changeCounter++;
    const changeId = this.changeCounter;

    log.watch(`Change detected: ${filename} (${eventType})`);
    
    // Clear existing deployment timer
    if (this.deploymentQueue) {
      clearTimeout(this.deploymentQueue);
    }

    // Set new deployment timer
    this.deploymentQueue = setTimeout(() => {
      this.triggerDeployment(changeId);
    }, this.options.debounceMs);

    log.dim(`Deployment queued (${this.options.debounceMs/1000}s delay)...`);
  }

  // Trigger deployment after debounce
  async triggerDeployment(changeId) {
    // Check cooldown period
    const timeSinceLastDeployment = Date.now() - this.lastDeployment;
    if (timeSinceLastDeployment < this.options.cooldownMs) {
      const remainingCooldown = Math.ceil((this.options.cooldownMs - timeSinceLastDeployment) / 1000);
      log.warning(`Deployment in cooldown. Waiting ${remainingCooldown}s...`);
      
      // Reschedule after cooldown
      this.deploymentQueue = setTimeout(() => {
        this.triggerDeployment(changeId);
      }, this.options.cooldownMs - timeSinceLastDeployment);
      return;
    }

    // Check if already deploying
    if (this.isDeploying) {
      log.warning('Deployment already in progress. Skipping...');
      return;
    }

    console.log(''); // Empty line for separation
    log.deploy(`🚀 Starting auto-deployment #${changeId}...`);
    
    try {
      this.isDeploying = true;
      this.lastDeployment = Date.now();

      // Create deployer with watch-specific options
      const deployer = new GitHubPagesDeployer({
        skipBuild: this.options.skipBuild,
        skipLint: this.options.skipLint,
        message: `feat: Auto-deploy after file changes #${changeId}

Triggered by file watcher
Changes detected in source files

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`
      });

      await deployer.deploy();
      
      log.success(`Auto-deployment #${changeId} completed!`);
      
    } catch (error) {
      log.error(`Auto-deployment #${changeId} failed: ${error.message}`);
      
      // Don't stop watching on deployment failure
      log.warning('Continuing to watch for changes...');
    } finally {
      this.isDeploying = false;
      console.log(''); // Empty line for separation
      this.showWatchStatus();
    }
  }

  // Show current watch status
  showWatchStatus() {
    log.watch('👀 Watching for changes...');
    log.dim(`   Paths: ${this.options.watchPaths.join(', ')}`);
    log.dim(`   Debounce: ${this.options.debounceMs/1000}s | Cooldown: ${this.options.cooldownMs/1000}s`);
    log.dim('   Press Ctrl+C to stop watching');
  }

  // Start watching
  start() {
    console.log('');
    log.deploy('🔍 Starting deployment watcher...');
    
    // Validate watch paths exist
    const fs = require('fs');
    const validPaths = this.options.watchPaths.filter(watchPath => {
      const fullPath = join(PROJECT_ROOT, watchPath);
      const exists = fs.existsSync(fullPath);
      if (!exists) {
        log.warning(`Watch path does not exist: ${watchPath}`);
      }
      return exists;
    });

    if (validPaths.length === 0) {
      log.error('No valid watch paths found!');
      process.exit(1);
    }

    // Start watchers for each path
    validPaths.forEach(watchPath => {
      const fullPath = join(PROJECT_ROOT, watchPath);
      
      try {
        const watcher = watch(
          fullPath,
          { recursive: true },
          (eventType, filename) => {
            this.handleChange(eventType, filename, fullPath);
          }
        );
        
        this.watchers.push(watcher);
        log.success(`Watching: ${watchPath}`);
        
      } catch (error) {
        log.error(`Failed to watch ${watchPath}: ${error.message}`);
      }
    });

    console.log('');
    this.showWatchStatus();

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      this.stop();
    });

    process.on('SIGTERM', () => {
      this.stop();
    });
  }

  // Stop watching
  stop() {
    console.log('');
    log.watch('🛑 Stopping deployment watcher...');
    
    // Clear any pending deployment
    if (this.deploymentQueue) {
      clearTimeout(this.deploymentQueue);
    }

    // Close all watchers
    this.watchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    log.success('Watch stopped. Goodbye!');
    process.exit(0);
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    debounceMs: 5000,
    cooldownMs: 60000,
    skipBuild: false,
    skipLint: false,
    help: false,
    watchPaths: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--debounce':
        options.debounceMs = parseInt(args[++i]) * 1000;
        break;
      case '--cooldown':
        options.cooldownMs = parseInt(args[++i]) * 1000;
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--skip-lint':
        options.skipLint = true;
        break;
      case '--watch-paths':
        options.watchPaths = args[++i].split(',');
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
${colors.bold}GitHub Pages Watch & Auto-Deploy${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/watch-and-deploy.js [options]

${colors.cyan}Options:${colors.reset}
  --debounce <seconds>   Wait time after last change (default: 5)
  --cooldown <seconds>   Minimum time between deployments (default: 60)
  --skip-build          Skip the frontend build process
  --skip-lint           Skip linting before build
  --watch-paths <paths> Comma-separated paths to watch
  -h, --help            Show this help message

${colors.cyan}Examples:${colors.reset}
  node scripts/watch-and-deploy.js
  node scripts/watch-and-deploy.js --debounce 10 --cooldown 120
  node scripts/watch-and-deploy.js --skip-lint --watch-paths "frontend/src,backend/src"

${colors.cyan}What this does:${colors.reset}
  👀 Watches source files for changes
  ⏱️  Waits for changes to settle (debounce)
  🚀 Automatically builds and deploys
  ⏳ Prevents too frequent deployments (cooldown)
  🔄 Continues watching after deployment

${colors.cyan}Watched file types:${colors.reset}
  • JavaScript/React (.js, .jsx, .ts, .tsx)
  • Styles (.css, .scss, .sass)
  • HTML and JSON files
  • Documentation (.md)
  • Smart contracts (.sol)

${colors.yellow}Press Ctrl+C to stop watching${colors.reset}
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const watcher = new DeploymentWatcher(options);
  watcher.start();
}

export { DeploymentWatcher };