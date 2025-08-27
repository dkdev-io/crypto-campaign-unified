#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function setupNetlifyEnvVars() {
  console.log('🚀 Starting automated Netlify environment variable setup...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to Netlify environment variables page
    console.log('📡 Navigating to Netlify environment variables page...');
    await page.goto('https://app.netlify.com/sites/8cc1205a-9f71-4ad1-a7ff-60a731bed30b/settings/env');
    
    // Wait for login if needed
    console.log('⏳ Waiting for page to load (login if prompted)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're on the login page
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      console.log('🔑 Please log in to Netlify in the browser window...');
      console.log('⏸️  Script will wait for 30 seconds for manual login...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    // Navigate again after potential login
    await page.goto('https://app.netlify.com/sites/8cc1205a-9f71-4ad1-a7ff-60a731bed30b/settings/env');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔧 Setting up environment variables...');
    
    // Add MIGRATION_SUPABASE_URL
    await addEnvironmentVariable(page, 'MIGRATION_SUPABASE_URL', 'https://kmepcdsklnnxokoimvzo.supabase.co');
    
    // Add MIGRATION_SUPABASE_SERVICE_KEY
    await addEnvironmentVariable(page, 'MIGRATION_SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0NjI0OCwiZXhwIjoyMDcxMTIyMjQ4fQ.ILZgJNM0h6KuChk7zBFMOUZe_VftQjVOWk_BFYT7VqE');
    
    console.log('✅ Environment variables configured successfully!');
    console.log('🔄 Triggering deployment...');
    
    // Navigate to deploys page and trigger new deployment
    await page.goto('https://app.netlify.com/sites/8cc1205a-9f71-4ad1-a7ff-60a731bed30b/deploys');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for deploy button
    try {
      await page.click('[data-testid="trigger-deploy"]');
      console.log('🎯 Deployment triggered!');
    } catch (e) {
      console.log('⚠️  Could not auto-trigger deployment, but environment variables are set');
    }
    
    console.log('🎉 Setup complete! GitGuardian alerts should be resolved after deployment.');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    await browser.close();
  }
}

async function addEnvironmentVariable(page, key, value) {
  try {
    console.log(`📝 Adding ${key}...`);
    
    // Click "Add variable" button
    await page.waitForSelector('button:has-text("Add variable"), button:has-text("New variable")', { timeout: 10000 });
    await page.click('button:has-text("Add variable"), button:has-text("New variable")');
    await page.waitForTimeout(1000);
    
    // Fill in key
    await page.waitForSelector('input[placeholder*="Key"], input[name="key"]');
    await page.fill('input[placeholder*="Key"], input[name="key"]', key);
    await page.waitForTimeout(500);
    
    // Fill in value
    await page.waitForSelector('input[placeholder*="Value"], textarea[placeholder*="Value"], input[name="value"]');
    await page.fill('input[placeholder*="Value"], textarea[placeholder*="Value"], input[name="value"]', value);
    await page.waitForTimeout(500);
    
    // Save the variable
    await page.click('button:has-text("Save"), button:has-text("Add")');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ ${key} added successfully`);
    
  } catch (error) {
    console.error(`❌ Failed to add ${key}:`, error.message);
    throw error;
  }
}

// Run the setup
setupNetlifyEnvVars().catch(console.error);