const puppeteer = require('puppeteer');

async function testDonorAuthDirect() {
  console.log('🧪 Testing Donor Authentication - Direct Browser Test');
  console.log('==================================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'],
    slowMo: 500
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to donor auth page
    console.log('📍 Step 1: Navigate to donor auth page');
    await page.goto('http://localhost:3000/donors/auth/login');
    
    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({ path: 'donor-auth-page-loaded.png' });
    console.log('📸 Screenshot saved as donor-auth-page-loaded.png');
    
    // Get page content to analyze
    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log('📍 Page content preview:', pageContent.substring(0, 300));
    
    // Look for form elements
    const hasEmailInput = await page.$('input[name="email"]') !== null;
    const hasPasswordInput = await page.$('input[name="password"]') !== null;
    const hasSubmitButton = await page.$('button[type="submit"]') !== null;
    
    console.log('📍 Form elements found:');
    console.log(`   - Email input: ${hasEmailInput ? '✅' : '❌'}`);
    console.log(`   - Password input: ${hasPasswordInput ? '✅' : '❌'}`);
    console.log(`   - Submit button: ${hasSubmitButton ? '✅' : '❌'}`);
    
    if (hasEmailInput && hasPasswordInput && hasSubmitButton) {
      console.log('\n📍 Step 2: Fill in credentials');
      await page.type('input[name="email"]', 'test@dkdev.io');
      await page.type('input[name="password"]', 'TestDonor123!');
      
      console.log('📍 Step 3: Submit form and observe');
      await page.click('button[type="submit"]');
      
      // Wait and observe what happens
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentUrl = page.url();
      const newPageContent = await page.evaluate(() => document.body.innerText);
      
      console.log(`📍 After submit - URL: ${currentUrl}`);
      console.log(`📍 After submit - Content preview:`, newPageContent.substring(0, 300));
      
      // Check for various outcomes
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ SUCCESS: Redirected to dashboard!');
      } else if (newPageContent.toLowerCase().includes('error')) {
        console.log('❌ LOGIN ERROR: Form shows error message');
        // Look for specific error
        const errorMatch = newPageContent.match(/error[^.]*[.!]/i);
        if (errorMatch) {
          console.log('   Error message:', errorMatch[0]);
        }
      } else if (newPageContent.toLowerCase().includes('verify')) {
        console.log('📧 EMAIL VERIFICATION: Need to verify email');
      } else {
        console.log('⚠️  UNCLEAR RESULT: Check screenshots');
      }
      
      // Final screenshot
      await page.screenshot({ path: 'donor-auth-after-submit.png' });
      console.log('📸 Final screenshot saved as donor-auth-after-submit.png');
      
    } else {
      console.log('❌ FAILURE: Donor auth form not found or incomplete');
    }
    
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will stay open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    try {
      await page.screenshot({ path: 'donor-auth-error.png' });
    } catch (e) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testDonorAuthDirect();