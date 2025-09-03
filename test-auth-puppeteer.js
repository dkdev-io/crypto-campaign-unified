#!/usr/bin/env node

import puppeteer from 'puppeteer';

console.log('🔍 Testing auth with Puppeteer in real browser...');

async function testCampaignAuth() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 500,
    devtools: true 
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log(`BROWSER LOG: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error(`BROWSER ERROR: ${error.message}`);
    });

    console.log('📍 Navigating to campaigns/auth...');
    await page.goto('http://localhost:5174/campaigns/auth', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });

    // Wait for form to load
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    console.log('✅ Auth form loaded');

    // Fill in credentials
    console.log('📝 Filling in credentials...');
    await page.type('input[name="email"]', 'test@dkdev.io');
    await page.type('input[name="password"]', 'TestDonor123!');
    
    console.log('🔍 Clicking submit...');
    
    // Listen for navigation or errors
    const submitPromise = page.click('button[type="submit"]');
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('supabase') && response.url().includes('token'), 
      { timeout: 10000 }
    ).catch(() => null); // Don't fail if no auth request
    
    await submitPromise;
    console.log('✅ Submit clicked');
    
    // Wait for either success navigation or error
    const response = await Promise.race([
      responsePromise,
      page.waitForNavigation({ timeout: 5000 }).catch(() => null),
      page.waitForSelector('.text-destructive', { timeout: 5000 }).then(() => 'error')
    ]);
    
    if (response === 'error') {
      const errorText = await page.$eval('.text-destructive', el => el.textContent).catch(() => 'Unknown error');
      console.error('❌ Auth failed with error:', errorText);
      
      // Get more details from console
      const logs = await page.evaluate(() => {
        return window.console._logs || [];
      });
      console.log('Browser logs:', logs);
      
      return { success: false, error: errorText };
    }
    
    if (response && response.url) {
      console.log('📡 Auth request made to:', response.url());
      const responseText = await response.text();
      console.log('📡 Response:', responseText.substring(0, 200));
    }
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/setup')) {
      console.log('✅ Successfully redirected to setup!');
      return { success: true };
    } else {
      console.log('⚠️ Unexpected redirect or no redirect');
      return { success: false, error: 'No redirect to setup' };
    }
    
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

testCampaignAuth().then(result => {
  console.log('\n🏁 Puppeteer test result:', result);
  process.exit(result.success ? 0 : 1);
});