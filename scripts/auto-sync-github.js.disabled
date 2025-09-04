#!/usr/bin/env node

/**
 * Auto-sync GitHub Script
 * Watches for file changes and automatically commits/pushes to GitHub
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class AutoSyncGitHub {
  constructor() {
    this.isRunning = false;
    this.pendingChanges = new Set();
    this.debounceTimer = null;
    this.debounceDelay = 10000; // 10 seconds
    this.maxCommitDelay = 300000; // 5 minutes max
    this.lastCommitTime = Date.now();
  }

  async start() {
    console.log('🚀 Starting Auto-Sync GitHub Service...');
    
    if (this.isRunning) {
      console.log('⚠️ Auto-sync already running');
      return;
    }

    this.isRunning = true;
    
    try {
      // Check git status
      await this.checkGitStatus();
      
      // Start file watcher
      this.startFileWatcher();
      
      // Start periodic sync check
      this.startPeriodicSync();
      
      console.log('✅ Auto-Sync GitHub Service started successfully');
      console.log('📁 Watching: /Users/Danallovertheplace/crypto-campaign-unified');
      console.log('⏱️ Debounce delay: 10 seconds');
      console.log('🔄 Max commit delay: 5 minutes');
      
    } catch (error) {
      console.error('❌ Failed to start auto-sync:', error.message);
      this.isRunning = false;
    }
  }

  async checkGitStatus() {
    try {
      const { stdout } = await execAsync('git status --porcelain');
      if (stdout.trim()) {
        console.log('📝 Found uncommitted changes, syncing now...');
        await this.syncToGitHub();
      } else {
        console.log('✅ Working tree clean');
      }
    } catch (error) {
      console.error('❌ Git status check failed:', error.message);
    }
  }

  startFileWatcher() {
    console.log('👀 Starting file watcher...');
    
    // Use fs.watch for better performance
    const watcher = fs.watch('.', { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      
      // Skip node_modules, .git, and other irrelevant files
      if (filename.includes('node_modules') || 
          filename.includes('.git') || 
          filename.includes('dist/') ||
          filename.includes('.DS_Store') ||
          filename.includes('.log')) {
        return;
      }

      // Only watch important file types
      const importantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.json', '.md', '.css', '.html', '.toml', '.yml', '.yaml'];
      const hasImportantExtension = importantExtensions.some(ext => filename.endsWith(ext));
      
      if (hasImportantExtension || filename.includes('package.json') || filename.includes('.env')) {
        console.log(`📝 File changed: ${filename}`);
        this.pendingChanges.add(filename);
        this.scheduleSync();
      }
    });

    // Handle watcher errors
    watcher.on('error', (error) => {
      console.error('👀 File watcher error:', error.message);
    });
  }

  scheduleSync() {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Schedule sync with debounce
    this.debounceTimer = setTimeout(() => {
      this.syncToGitHub();
    }, this.debounceDelay);

    console.log(`⏳ Sync scheduled in ${this.debounceDelay / 1000} seconds...`);
  }

  startPeriodicSync() {
    // Force sync every 5 minutes if there are changes
    setInterval(() => {
      const timeSinceLastCommit = Date.now() - this.lastCommitTime;
      if (this.pendingChanges.size > 0 && timeSinceLastCommit > this.maxCommitDelay) {
        console.log('⏰ Forcing periodic sync (5 minutes elapsed)');
        this.syncToGitHub();
      }
    }, 60000); // Check every minute
  }

  async syncToGitHub() {
    if (this.pendingChanges.size === 0) {
      return;
    }

    console.log('🔄 Starting GitHub sync...');
    
    try {
      // Check if there are actually changes to commit
      const { stdout: statusOutput } = await execAsync('git status --porcelain');
      if (!statusOutput.trim()) {
        console.log('✅ No changes to commit');
        this.pendingChanges.clear();
        return;
      }

      // Stage all changes
      await execAsync('git add .');
      console.log('📁 Staged all changes');

      // Create commit message
      const changedFiles = Array.from(this.pendingChanges).slice(0, 5);
      const commitMessage = this.generateCommitMessage(changedFiles);
      
      // Commit changes
      await execAsync(`git commit -m "${commitMessage}"`);
      console.log(`📝 Committed: ${commitMessage}`);

      // Push to GitHub
      await execAsync('git push origin main');
      console.log('🚀 Pushed to GitHub successfully');

      // Reset tracking
      this.pendingChanges.clear();
      this.lastCommitTime = Date.now();
      
      console.log('✅ Auto-sync completed successfully');
      
    } catch (error) {
      console.error('❌ Auto-sync failed:', error.message);
      
      // Don't clear pending changes on failure, retry later
      if (error.message.includes('nothing to commit')) {
        this.pendingChanges.clear();
      }
    }
  }

  generateCommitMessage(changedFiles) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    if (changedFiles.length === 1) {
      const file = changedFiles[0];
      return `Auto-sync: Update ${file} | ${timestamp}`;
    } else if (changedFiles.length <= 3) {
      return `Auto-sync: Update ${changedFiles.join(', ')} | ${timestamp}`;
    } else {
      return `Auto-sync: Update ${changedFiles.length} files (${changedFiles.slice(0, 2).join(', ')} +${changedFiles.length - 2} more) | ${timestamp}`;
    }
  }

  stop() {
    console.log('🛑 Stopping Auto-Sync GitHub Service...');
    this.isRunning = false;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Final sync before stopping
    if (this.pendingChanges.size > 0) {
      console.log('🔄 Final sync before stopping...');
      this.syncToGitHub();
    }
    
    console.log('✅ Auto-Sync GitHub Service stopped');
  }
}

// CLI interface
const command = process.argv[2];
const autoSync = new AutoSyncGitHub();

switch (command) {
  case 'start':
    autoSync.start();
    
    // Keep process alive
    process.on('SIGINT', () => {
      autoSync.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      autoSync.stop();
      process.exit(0);
    });
    break;
    
  case 'stop':
    console.log('🛑 Auto-sync stop command received');
    process.exit(0);
    break;
    
  default:
    console.log(`
🤖 Auto-Sync GitHub Service

Usage:
  node scripts/auto-sync-github.js start    Start auto-sync service
  node scripts/auto-sync-github.js stop     Stop auto-sync service

Features:
  ✅ Watches all project files for changes
  ✅ Debounces commits (10 second delay)  
  ✅ Auto-commits with descriptive messages
  ✅ Auto-pushes to GitHub main branch
  ✅ Handles errors gracefully
  ✅ Periodic sync every 5 minutes max
  ✅ Ignores node_modules and build files
`);
    break;
}