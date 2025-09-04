const puppeteer = require('puppeteer');

async function testRealDonorAuth() {
  console.log('🎯 Testing Real DonorAuth Component');
  console.log('================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'],
    slowMo: 300
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(`ERROR: ${msg.text()}`);
      }
    });
    
    console.log('📍 Testing real DonorAuth component...');
    await page.goto('http://localhost:5173/donors/auth/login', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Page content preview:`, pageContent.substring(0, 300));
    
    // Check for form elements
    const hasEmailInput = await page.$('input[name="email"]') !== null;
    const hasPasswordInput = await page.$('input[name="password"]') !== null;
    const hasSubmitButton = await page.$('button[type="submit"]') !== null;
    const hasSignInText = pageContent.includes('Sign In') || pageContent.includes('Sign in');
    const hasDonorsText = pageContent.includes('Donors');
    
    console.log('\n📍 Component Analysis:');
    console.log(`   Has donor-specific content: ${hasDonorsText ? '✅' : '❌'}`);
    console.log(`   Has sign-in text: ${hasSignInText ? '✅' : '❌'}`);
    console.log(`   Email input: ${hasEmailInput ? '✅' : '❌'}`);
    console.log(`   Password input: ${hasPasswordInput ? '✅' : '❌'}`);
    console.log(`   Submit button: ${hasSubmitButton ? '✅' : '❌'}`);
    
    if (consoleMessages.length > 0) {
      console.log('\n⚠️  Console Errors:');
      consoleMessages.forEach(msg => console.log(`   ${msg}`));
    }
    
    if (hasEmailInput && hasPasswordInput && hasSubmitButton && hasDonorsText) {
      console.log('\n🎉 SUCCESS: DonorAuth component is fully loaded and functional!');
      
      // Try to fill out and submit the form
      console.log('\n📍 Testing form interaction...');
      await page.type('input[name="email"]', 'test@dkdev.io');
      await page.type('input[name="password"]', 'TestDonor123!');
      
      console.log('📍 Submitting form...');
      await page.click('button[type="submit"]');
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const afterSubmitUrl = page.url();
      const afterSubmitContent = await page.evaluate(() => document.body.innerText);
      
      console.log(`\nAfter submit URL: ${afterSubmitUrl}`);
      console.log(`After submit content preview: ${afterSubmitContent.substring(0, 200)}`);
      
      if (afterSubmitUrl.includes('/dashboard')) {
        console.log('✅ PERFECT: Login worked and redirected to dashboard!');
      } else if (afterSubmitContent.includes('error')) {
        console.log('⚠️  AUTH ERROR: Form shows error (expected - Supabase not running)');
      } else {
        console.log('⚠️  UNCLEAR: Check screenshot for details');
      }
      
    } else {
      console.log('❌ FAILURE: DonorAuth component not loading properly');
    }
    
    await page.screenshot({ path: 'real-donor-auth-test.png' });
    console.log('\n📸 Screenshot saved as real-donor-auth-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testRealDonorAuth();