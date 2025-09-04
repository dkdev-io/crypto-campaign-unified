const puppeteer = require('puppeteer');

async function testBypassButton() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('BYPASS')) {
      console.log('🔔 Console:', msg.text());
    }
  });

  console.log('📍 Step 1: Navigating to campaign auth page...');
  await page.goto('http://localhost:5173/campaigns/auth', { 
    waitUntil: 'networkidle0' 
  });

  // Wait for page to load
  await page.waitForTimeout(1000);

  console.log('📍 Step 2: Looking for DEV BYPASS button...');
  
  // Check if button exists
  const bypassButton = await page.$('button:has-text("DEV BYPASS")');
  
  if (!bypassButton) {
    // Try alternative selector
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => btn.innerText)
    );
    console.log('Available buttons:', buttons);
    
    // Look for button containing the text
    const found = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bypass = buttons.find(btn => btn.innerText.includes('DEV BYPASS'));
      return bypass ? true : false;
    });
    
    if (found) {
      console.log('✅ DEV BYPASS button found!');
      
      // Click the button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const bypass = buttons.find(btn => btn.innerText.includes('DEV BYPASS'));
        if (bypass) {
          console.log('Clicking DEV BYPASS button...');
          bypass.click();
        }
      });
      
      console.log('📍 Step 3: Clicked bypass button, waiting for navigation...');
      await page.waitForTimeout(2000);
      
      // Check current URL
      const newUrl = page.url();
      console.log('📍 Current URL:', newUrl);
      
      if (newUrl.includes('/campaigns/auth/setup')) {
        console.log('✅ SUCCESS: Navigated to setup page!');
        
        // Check if bypass worked (setup wizard should be visible)
        const setupContent = await page.evaluate(() => {
          const body = document.body.innerText;
          return body;
        });
        
        if (setupContent.includes('Committee') || setupContent.includes('Setup') || setupContent.includes('Step')) {
          console.log('✅ Setup wizard is visible - bypass worked!');
        } else {
          console.log('⚠️ On setup page but content unclear');
        }
      } else {
        console.log('❌ Failed to navigate to setup page');
      }
    } else {
      console.log('❌ DEV BYPASS button not found on page');
    }
  }

  await page.screenshot({ path: 'bypass-button-test.png' });
  console.log('📸 Screenshot saved as bypass-button-test.png');

  await browser.close();
}

testBypassButton().catch(console.error);