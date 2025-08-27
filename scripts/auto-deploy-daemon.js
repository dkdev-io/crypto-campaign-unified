#!/usr/bin/env node

/**
 * Background daemon for automatic deployment
 * Runs as a background service and handles deployment automatically
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const DAEMON_PID_FILE = join(PROJECT_ROOT, '.auto-deploy-daemon.pid');
const DAEMON_LOG_FILE = join(PROJECT_ROOT, '.auto-deploy-daemon.log');

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
};

class AutoDeployDaemon {
  constructor() {
    this.process = null;
    this.logStream = null;
  }

  // Check if daemon is already running
  isRunning() {
    if (!existsSync(DAEMON_PID_FILE)) {
      return false;
    }

    try {
      const pid = parseInt(readFileSync(DAEMON_PID_FILE, 'utf8').trim());
      
      // Check if process exists
      process.kill(pid, 0);
      return pid;
    } catch (error) {
      // Process doesn't exist, remove stale PID file
      try {
        require('fs').unlinkSync(DAEMON_PID_FILE);
      } catch (e) {
        // Ignore cleanup errors
      }
      return false;
    }
  }

  // Start the daemon
  start() {
    const existingPid = this.isRunning();
    if (existingPid) {
      log.warning(`Daemon already running with PID ${existingPid}`);
      return false;
    }

    log.daemon('Starting auto-deploy daemon...');

    // Spawn the watch process as a detached background process
    const watchProcess = spawn('node', [
      join(__dirname, 'watch-and-deploy.js'),
      '--skip-lint',
      '--debounce', '3',
      '--cooldown', '30'
    ], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Write PID file
    writeFileSync(DAEMON_PID_FILE, watchProcess.pid.toString());

    // Setup logging
    const logData = (data) => {
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] ${data}\n`;
      
      try {
        require('fs').appendFileSync(DAEMON_LOG_FILE, logLine);
      } catch (error) {
        // Ignore logging errors
      }
    };

    watchProcess.stdout.on('data', logData);
    watchProcess.stderr.on('data', logData);

    // Log startup
    logData('Auto-deploy daemon started');

    // Handle process events
    watchProcess.on('error', (error) => {
      logData(`Daemon error: ${error.message}`);
    });

    watchProcess.on('exit', (code, signal) => {
      logData(`Daemon exited with code ${code}, signal ${signal}`);
      this.cleanup();
    });

    // Detach the process so it continues running
    watchProcess.unref();

    log.success(`Daemon started with PID ${watchProcess.pid}`);
    log.success(`Logs: ${DAEMON_LOG_FILE}`);
    log.daemon('Daemon is now watching for file changes and will auto-deploy');
    
    return true;
  }

  // Stop the daemon
  stop() {
    const pid = this.isRunning();
    if (!pid) {
      log.warning('Daemon is not running');
      return false;
    }

    log.daemon(`Stopping daemon with PID ${pid}...`);

    try {
      // Try graceful shutdown first
      process.kill(pid, 'SIGTERM');
      
      // Wait a moment
      setTimeout(() => {
        try {
          // Check if still running, force kill if needed
          process.kill(pid, 0);
          log.warning('Daemon still running, force killing...');
          process.kill(pid, 'SIGKILL');
        } catch (error) {
          // Process already stopped
        }
        
        this.cleanup();
        log.success('Daemon stopped');
      }, 2000);
      
    } catch (error) {
      log.error(`Failed to stop daemon: ${error.message}`);
      return false;
    }

    return true;
  }

  // Clean up daemon files
  cleanup() {
    try {
      if (existsSync(DAEMON_PID_FILE)) {
        require('fs').unlinkSync(DAEMON_PID_FILE);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Restart the daemon
  restart() {
    log.daemon('Restarting daemon...');
    this.stop();
    
    setTimeout(() => {
      this.start();
    }, 3000);
  }

  // Show daemon status
  status() {
    const pid = this.isRunning();
    
    if (pid) {
      log.success(`Daemon is running with PID ${pid}`);
      
      // Show log tail if available
      if (existsSync(DAEMON_LOG_FILE)) {
        log.info('Recent activity:');
        try {
          const logs = readFileSync(DAEMON_LOG_FILE, 'utf8');
          const lines = logs.trim().split('\n').slice(-5);
          lines.forEach(line => {
            if (line.trim()) {
              log.dim(line);
            }
          });
        } catch (error) {
          log.dim('Could not read log file');
        }
      }
      
      log.daemon('Auto-deployment is active - changes will be deployed automatically');
    } else {
      log.warning('Daemon is not running');
      log.info('Use: npm run daemon:start to begin auto-deployment');
    }
  }

  // Show daemon logs
  logs() {
    if (!existsSync(DAEMON_LOG_FILE)) {
      log.warning('No log file found');
      return;
    }

    try {
      const logs = readFileSync(DAEMON_LOG_FILE, 'utf8');
      if (logs.trim()) {
      } else {
        log.info('Log file is empty');
      }
    } catch (error) {
      log.error(`Could not read log file: ${error.message}`);
    }
  }
}

// CLI Interface
function parseCommand() {
  const command = process.argv[2];
  const validCommands = ['start', 'stop', 'restart', 'status', 'logs', 'help'];
  
  if (!command || !validCommands.includes(command)) {
    showHelp();
    process.exit(1);
  }
  
  return command;
}

function showHelp() {
${colors.bold}Auto-Deploy Daemon${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/auto-deploy-daemon.js <command>

${colors.cyan}Commands:${colors.reset}
  start    Start the auto-deploy daemon
  stop     Stop the auto-deploy daemon
  restart  Restart the auto-deploy daemon
  status   Show daemon status
  logs     Show daemon logs
  help     Show this help message

${colors.cyan}Examples:${colors.reset}
  node scripts/auto-deploy-daemon.js start
  node scripts/auto-deploy-daemon.js status
  node scripts/auto-deploy-daemon.js logs

${colors.cyan}What this does:${colors.reset}
  🤖 Runs auto-deployment in the background
  👀 Watches for file changes continuously
  🚀 Deploys changes automatically
  📊 Logs all activity
  🔄 Keeps running even if you close terminal

${colors.yellow}The daemon runs independently and will continue${colors.reset}
${colors.yellow}monitoring and deploying changes until stopped.${colors.reset}
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = parseCommand();
  const daemon = new AutoDeployDaemon();

  switch (command) {
    case 'start':
      daemon.start();
      break;
    case 'stop':
      daemon.stop();
      break;
    case 'restart':
      daemon.restart();
      break;
    case 'status':
      daemon.status();
      break;
    case 'logs':
      daemon.logs();
      break;
    case 'help':
      showHelp();
      break;
  }
}

export { AutoDeployDaemon };