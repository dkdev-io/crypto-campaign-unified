#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testCompleteJourney() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 300
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🧪 TESTING COMPLETE USER JOURNEY');
    console.log('='.repeat(40));
    
    console.log('\n📍 Step 1: Testing Invite Form at /invite-test');
    await page.goto('http://localhost:5175/invite-test', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Fill out invite form
    await page.type('input[type="email"], input[placeholder*="Email"]', 'test@example.com');
    await page.click('input[type="checkbox"]'); // Check first permission
    
    console.log('✅ Filled invite form with test email and permissions');
    
    // Click Send Invitations
    console.log('\n📍 Step 2: Clicking "Send Invitations"...');
    
    // Listen for alert dialog
    page.on('dialog', async dialog => {
      console.log(`📝 Alert received: ${dialog.message().slice(0, 100)}...`);
      await dialog.accept();
    });
    
    // Click send button
    await page.click('button[type="submit"]');
    
    // Wait for potential redirect
    console.log('⏳ Waiting for redirect to campaign setup...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL after invite: ${currentUrl}`);
    
    // Check if we're at the setup page
    const atSetupPage = currentUrl.includes('/setup');
    console.log(`✅ Redirected to setup page: ${atSetupPage ? '✓' : '✗'}`);
    
    if (atSetupPage) {
      // Analyze setup page content
      const setupContent = await page.evaluate(() => ({
        title: document.title,
        hasSetupForm: document.body.innerText.includes('Campaign') || 
                     document.body.innerText.includes('Step') ||
                     document.body.innerText.includes('Setup'),
        bodySnippet: document.body.innerText.slice(0, 300)
      }));
      
      console.log('\n📋 SETUP PAGE ANALYSIS:');
      console.log(`Title: ${setupContent.title}`);
      console.log(`Has setup content: ${setupContent.hasSetupForm}`);
      console.log(`Content preview: ${setupContent.bodySnippet}`);
      
      console.log('\n🎯 JOURNEY VERIFICATION:');
      console.log('✅ User can fill invite form');
      console.log('✅ User can send invitations'); 
      console.log(`✅ User redirected to campaign setup: ${atSetupPage}`);
      console.log(`✅ Setup page loads properly: ${setupContent.hasSetupForm}`);
      
      const journeyComplete = atSetupPage && setupContent.hasSetupForm;
      console.log(`\n🏆 COMPLETE USER JOURNEY WORKING: ${journeyComplete ? '✅ YES' : '❌ NO'}`);
      
    } else {
      console.log('❌ Failed to redirect to setup page');
      console.log('Current page content:');
      const content = await page.evaluate(() => document.body.innerText.slice(0, 200));
      console.log(content);
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/complete-journey.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved to: scripts/complete-journey.png');
    console.log('\n🔍 Browser staying open for 8 seconds...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteJourney().catch(console.error);