const puppeteer = require('puppeteer');

async function testDonorDevbypass() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('1. Navigating to donor auth page...');
  await page.goto('http://localhost:5173/donors/auth');
  
  // Wait for page to load
  await page.waitForSelector('h2', { timeout: 5000 });
  
  console.log('2. Looking for DEV BYPASS button...');
  
  // Check if button exists
  const bypassButton = await page.$('button:has-text("DEV BYPASS → Dashboard")');
  if (!bypassButton) {
    console.log('❌ DEV BYPASS button not found');
    // Try to find any yellow button
    const yellowButtons = await page.$$('button.bg-yellow-500');
    console.log(`Found ${yellowButtons.length} yellow buttons`);
    
    if (yellowButtons.length > 0) {
      const buttonText = await yellowButtons[0].textContent();
      console.log(`First yellow button text: "${buttonText}"`);
    }
  } else {
    console.log('✅ DEV BYPASS button found');
  }
  
  // Try to click it
  console.log('3. Clicking DEV BYPASS button...');
  try {
    await page.click('button[class*="bg-yellow-500"]');
    console.log('✅ Clicked DEV BYPASS button');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`4. Current URL after click: ${currentUrl}`);
    
    if (currentUrl.includes('/donors/dashboard')) {
      console.log('✅ Successfully navigated to donor dashboard');
    } else {
      console.log('❌ Did not navigate to donor dashboard');
    }
    
  } catch (error) {
    console.log('❌ Failed to click DEV BYPASS button:', error.message);
  }
  
  await browser.close();
}

testDonorDevbypass().catch(console.error);