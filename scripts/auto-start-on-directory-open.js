#!/usr/bin/env node

/**
 * Automatically starts deployment monitoring when directory is accessed
 * This runs without any commands needed
 */

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const AUTOSTART_LOCK = join(PROJECT_ROOT, '.autostart.lock');
const AUTOSTART_LOG = join(PROJECT_ROOT, '.autostart.log');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m'
};

const log = (msg) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${msg}\n`;
  
  try {
    require('fs').appendFileSync(AUTOSTART_LOG, logLine);
  } catch (error) {
    // Ignore logging errors
  }
  
};

class AutoStart {
  constructor() {
    this.lockFile = AUTOSTART_LOCK;
    this.isRunning = false;
  }

  // Check if auto-start is already running
  checkIfRunning() {
    if (!existsSync(this.lockFile)) {
      return false;
    }

    try {
      const data = JSON.parse(readFileSync(this.lockFile, 'utf8'));
      const pid = data.pid;
      
      // Check if process still exists
      process.kill(pid, 0);
      return data;
    } catch (error) {
      // Process doesn't exist or file is corrupted, remove lock
      try {
        require('fs').unlinkSync(this.lockFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      return false;
    }
  }

  // Start the auto-deployment system
  async start() {
    const existing = this.checkIfRunning();
    if (existing) {
      log(`Already running (PID: ${existing.pid}, started: ${existing.startTime})`);
      return;
    }

    log('Starting automatic deployment monitoring...');

    try {
      // Create lock file first
      const lockData = {
        pid: process.pid,
        startTime: new Date().toISOString(),
        projectRoot: PROJECT_ROOT
      };
      writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));

      // Start the daemon in the background
      const daemonProcess = spawn('node', [
        join(__dirname, 'auto-deploy-daemon.js'),
        'start'
      ], {
        cwd: PROJECT_ROOT,
        detached: true,
        stdio: 'ignore'
      });

      daemonProcess.unref();

      log(`Deployment monitoring started (PID: ${daemonProcess.pid})`);
      log('🎯 Your files will now auto-deploy when changed!');
      log('📁 Simply edit and save files - deployment happens automatically');
      
      // Set up cleanup on exit
      process.on('SIGINT', () => this.cleanup());
      process.on('SIGTERM', () => this.cleanup());
      process.on('exit', () => this.cleanup());

      // Keep the process alive briefly to establish the daemon
      setTimeout(() => {
        log('✅ Auto-deployment system is now active');
        log('💡 Edit any file and save - it will auto-deploy to GitHub Pages');
        process.exit(0);
      }, 2000);

    } catch (error) {
      log(`Error starting auto-deployment: ${error.message}`);
      this.cleanup();
      process.exit(1);
    }
  }

  // Cleanup lock file
  cleanup() {
    try {
      if (existsSync(this.lockFile)) {
        require('fs').unlinkSync(this.lockFile);
        log('Cleanup completed');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Show status
  status() {
    const running = this.checkIfRunning();
    if (running) {
    } else {
    }
  }
}

// Auto-execute when this directory is accessed
if (import.meta.url === `file://${process.argv[1]}`) {
  const autoStart = new AutoStart();
  
  if (process.argv[2] === 'status') {
    autoStart.status();
  } else {
    // Start automatically
    autoStart.start();
  }
}

export { AutoStart };