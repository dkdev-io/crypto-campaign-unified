const puppeteer = require('puppeteer');

async function testDonorAuth() {
  console.log('🧪 Testing Donor Authentication Flow');
  console.log('===================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to donor auth page
    console.log('📍 Step 1: Navigate to donor auth page');
    await page.goto('http://localhost:3000/donors/auth/login');
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill in login credentials
    console.log('📍 Step 2: Fill in test@dkdev.io credentials');
    await page.type('input[name="email"]', 'test@dkdev.io');
    await page.type('input[name="password"]', 'TestDonor123!');
    
    // Submit the form
    console.log('📍 Step 3: Submit login form');
    await page.click('button[type="submit"]');
    
    // Wait for response
    console.log('📍 Step 4: Wait for auth response...');
    await page.waitForTimeout(3000);
    
    // Check current URL and page content
    const currentUrl = page.url();
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`📍 Page contains error: ${pageContent.toLowerCase().includes('error')}`);
    console.log(`📍 Page contains login: ${pageContent.toLowerCase().includes('sign in')}`);
    console.log(`📍 Page contains dashboard: ${pageContent.toLowerCase().includes('dashboard')}`);
    
    if (currentUrl.includes('/donors/dashboard') || pageContent.includes('Dashboard')) {
      console.log('✅ SUCCESS: Donor auth worked! User was redirected to dashboard.');
    } else if (pageContent.toLowerCase().includes('error')) {
      console.log('❌ FAILURE: Login form showing error message');
      console.log('Error details:', pageContent.substring(0, 200));
    } else if (currentUrl.includes('/auth') && pageContent.toLowerCase().includes('sign in')) {
      console.log('❌ FAILURE: Still on login page - auth did not succeed');
    } else {
      console.log('⚠️  UNCLEAR: Unexpected state');
      console.log('Page content preview:', pageContent.substring(0, 200));
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'donor-auth-test-result.png' });
    console.log('📸 Screenshot saved as donor-auth-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

testDonorAuth();