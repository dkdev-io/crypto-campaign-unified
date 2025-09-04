#!/usr/bin/env node

/**
 * Script to automatically enable GitHub Pages for the repository
 */

import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {};

async function enableGitHubPages() {
  try {
    log.step('Enabling GitHub Pages...');

    // Get repository info
    const repoInfo = execSync('gh repo view --json owner,name', { encoding: 'utf8' });
    const { owner, name } = JSON.parse(repoInfo);
    log.info(`Repository: ${owner.login}/${name}`);

    // Check if Pages is already enabled
    try {
      const pagesInfo = execSync(`gh api repos/${owner.login}/${name}/pages`, { encoding: 'utf8' });
      const pages = JSON.parse(pagesInfo);
      log.success(`GitHub Pages already enabled: ${pages.html_url}`);
      return pages.html_url;
    } catch (error) {
      // Pages not enabled yet, continue to enable it
      log.info('GitHub Pages not yet enabled, setting up...');
    }

    // Create Pages configuration
    const pagesConfig = {
      source: {
        branch: 'main',
        path: '/',
      },
    };

    // Enable Pages using gh api
    const result = execSync(`gh api repos/${owner.login}/${name}/pages -X POST --input -`, {
      input: JSON.stringify(pagesConfig),
      encoding: 'utf8',
    });

    const pagesData = JSON.parse(result);
    const siteUrl = pagesData.html_url;

    log.success('GitHub Pages enabled successfully!');
    log.success(`Site URL: ${siteUrl}`);
    log.info('Note: It may take 5-10 minutes for your site to be available');

    return siteUrl;
  } catch (error) {
    log.error(`Failed to enable GitHub Pages: ${error.message}`);

    log.warning('Manual setup required:');
    log.info('1. Go to your GitHub repository');
    log.info('2. Click Settings → Pages');
    log.info('3. Under "Source", select "Deploy from a branch"');
    log.info('4. Choose "main" branch and "/ (root)" folder');
    log.info('5. Click Save');

    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  enableGitHubPages();
}

export { enableGitHubPages };
