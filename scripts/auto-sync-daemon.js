#!/usr/bin/env node

/**
 * Auto-Sync Daemon Manager
 * Manages the auto-sync service as a background daemon
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DAEMON_PID_FILE = '.auto-sync-daemon.pid';
const DAEMON_LOG_FILE = 'logs/auto-sync-daemon.log';

class AutoSyncDaemon {
  constructor() {
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }
  }

  async start() {
    // Check if already running
    if (this.isRunning()) {
      console.log('⚠️ Auto-sync daemon is already running');
      return;
    }

    console.log('🚀 Starting Auto-Sync Daemon...');

    // Spawn the auto-sync process as a daemon
    const child = spawn('node', ['scripts/auto-sync-github.js', 'start'], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Save PID
    fs.writeFileSync(DAEMON_PID_FILE, child.pid.toString());

    // Set up logging
    const logStream = fs.createWriteStream(DAEMON_LOG_FILE, { flags: 'a' });
    
    child.stdout.on('data', (data) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] [STDOUT] ${data}`);
    });

    child.stderr.on('data', (data) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] [STDERR] ${data}`);
    });

    child.on('exit', (code) => {
      const timestamp = new Date().toISOString();
      logStream.write(`[${timestamp}] [EXIT] Process exited with code ${code}\n`);
      this.cleanup();
    });

    // Detach from parent
    child.unref();

    console.log(`✅ Auto-sync daemon started with PID: ${child.pid}`);
    console.log(`📝 Logs: ${DAEMON_LOG_FILE}`);
    console.log('🔍 Use "npm run sync:status" to check status');
    console.log('🛑 Use "npm run sync:stop" to stop daemon');
  }

  async stop() {
    if (!this.isRunning()) {
      console.log('⚠️ Auto-sync daemon is not running');
      return;
    }

    const pid = this.getPID();
    console.log(`🛑 Stopping Auto-Sync Daemon (PID: ${pid})...`);

    try {
      // Try graceful shutdown first
      process.kill(pid, 'SIGTERM');
      
      // Wait a moment for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (this.isRunning()) {
        console.log('⚡ Force killing daemon...');
        process.kill(pid, 'SIGKILL');
      }

      this.cleanup();
      console.log('✅ Auto-sync daemon stopped successfully');
      
    } catch (error) {
      console.error('❌ Failed to stop daemon:', error.message);
      this.cleanup(); // Clean up PID file anyway
    }
  }

  async restart() {
    console.log('🔄 Restarting Auto-Sync Daemon...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  status() {
    if (this.isRunning()) {
      const pid = this.getPID();
      console.log(`✅ Auto-sync daemon is running (PID: ${pid})`);
      
      // Show recent logs
      if (fs.existsSync(DAEMON_LOG_FILE)) {
        console.log('\n📝 Recent logs (last 10 lines):');
        try {
          const { stdout } = require('child_process').execSync(`tail -n 10 "${DAEMON_LOG_FILE}"`);
          console.log(stdout.toString());
        } catch (error) {
          console.log('No recent logs available');
        }
      }
    } else {
      console.log('❌ Auto-sync daemon is not running');
    }
  }

  logs() {
    if (!fs.existsSync(DAEMON_LOG_FILE)) {
      console.log('📝 No logs available');
      return;
    }

    console.log(`📝 Showing logs from: ${DAEMON_LOG_FILE}`);
    console.log('=' * 50);
    
    try {
      const logs = fs.readFileSync(DAEMON_LOG_FILE, 'utf8');
      console.log(logs);
    } catch (error) {
      console.error('❌ Failed to read logs:', error.message);
    }
  }

  isRunning() {
    if (!fs.existsSync(DAEMON_PID_FILE)) {
      return false;
    }

    const pid = parseInt(fs.readFileSync(DAEMON_PID_FILE, 'utf8'));
    
    try {
      // Check if process exists
      process.kill(pid, 0);
      return true;
    } catch (error) {
      // Process doesn't exist, clean up PID file
      this.cleanup();
      return false;
    }
  }

  getPID() {
    if (!fs.existsSync(DAEMON_PID_FILE)) {
      return null;
    }
    return parseInt(fs.readFileSync(DAEMON_PID_FILE, 'utf8'));
  }

  cleanup() {
    if (fs.existsSync(DAEMON_PID_FILE)) {
      fs.unlinkSync(DAEMON_PID_FILE);
    }
  }
}

// CLI interface
const command = process.argv[2];
const daemon = new AutoSyncDaemon();

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
    
  default:
    console.log(`
🤖 Auto-Sync Daemon Manager

Usage:
  npm run sync:daemon:start     Start daemon
  npm run sync:daemon:stop      Stop daemon  
  npm run sync:daemon:restart   Restart daemon
  npm run sync:daemon:status    Show status
  npm run sync:daemon:logs      Show logs

The daemon will:
  ✅ Watch files for changes automatically
  ✅ Auto-commit and push to GitHub
  ✅ Run in background (detached process)
  ✅ Log all activity to logs/auto-sync-daemon.log
  ✅ Survive terminal closes
`);
    break;
}