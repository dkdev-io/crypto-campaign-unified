#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testAuth() {
  console.log('🚀 TESTING DEPLOYED AUTH: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('');

  const browser = await puppeteer.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  try {
    // Go to auth page
    console.log('1. Loading auth page...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'auth-test-1.png' });
    console.log('   ✅ Page loaded');

    // Fill email
    console.log('2. Filling email: dan@dkdev.io');
    await page.type('input[type="email"]', 'dan@dkdev.io');
    
    // Fill password  
    console.log('3. Filling password: DanPassword123!');
    await page.type('input[type="password"]', 'DanPassword123!');
    await page.screenshot({ path: 'auth-test-2.png' });
    
    // Click login
    console.log('4. Clicking login button...');
    await page.click('button');
    
    // Wait and check result
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'auth-test-3.png' });
    
    const url = page.url();
    const content = await page.content();
    
    console.log('   Current URL:', url);
    
    if (content.includes('error') || content.includes('invalid')) {
      console.log('❌ LOGIN FAILED - Error in response');
    } else if (url !== 'https://cryptocampaign.netlify.app/campaigns/auth') {
      console.log('✅ LOGIN SUCCESS - URL changed, likely redirected');
    } else {
      console.log('⚠️ UNCLEAR - Check screenshots');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('');
    console.log('📸 Check: auth-test-1.png, auth-test-2.png, auth-test-3.png');
  }
}

testAuth();