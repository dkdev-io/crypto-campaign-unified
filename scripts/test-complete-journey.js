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
    
    
    await page.goto('http://localhost:5175/invite-test', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Fill out invite form
    await page.type('input[type="email"], input[placeholder*="Email"]', 'test@example.com');
    await page.click('input[type="checkbox"]'); // Check first permission
    
    console.log('✅ Filled invite form with test email and permissions');
    
    // Click Send Invitations
    
    // Listen for alert dialog
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Click send button
    await page.click('button[type="submit"]');
    
    // Wait for potential redirect
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check current URL
    const currentUrl = page.url();
    
    // Check if we're at the setup page
    const atSetupPage = currentUrl.includes('/setup');
    
    if (atSetupPage) {
      // Analyze setup page content
      const setupContent = await page.evaluate(() => ({
        title: document.title,
        hasSetupForm: document.body.innerText.includes('Campaign') || 
                     document.body.innerText.includes('Step') ||
                     document.body.innerText.includes('Setup'),
        bodySnippet: document.body.innerText.slice(0, 300)
      }));
      
      
      console.log('✅ User can fill invite form');
      console.log('✅ User can send invitations'); 
      
      const journeyComplete = atSetupPage && setupContent.hasSetupForm;
      
    } else {
      console.log('❌ Failed to redirect to setup page');
      const content = await page.evaluate(() => document.body.innerText.slice(0, 200));
    }
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/scripts/complete-journey.png',
      fullPage: true 
    });
    
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteJourney().catch(console.error);