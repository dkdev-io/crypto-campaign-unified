const puppeteer = require('puppeteer');

async function testCorrectApp() {
  console.log('🎯 Testing Correct App on Port 5173');
  console.log('==================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📍 Testing donor auth route on correct app...');
    await page.goto('http://localhost:5173/donors/auth/login', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Page content preview:`, pageContent.substring(0, 300));
    
    if (pageContent.includes('TEST DONOR ROUTE')) {
      console.log('✅ SUCCESS: Donor route is now working with test component!');
    } else if (pageContent.includes('Donors') && pageContent.includes('Sign in')) {
      console.log('✅ SUCCESS: Donor auth form is now loading!');
    } else if (currentUrl !== 'http://localhost:5173/donors/auth/login') {
      console.log(`❌ REDIRECT: Still being redirected to ${currentUrl}`);
    } else {
      console.log('⚠️  UNKNOWN: Unexpected content');
    }
    
    // Check for form elements
    const hasEmailInput = await page.$('input[name="email"]') !== null;
    const hasPasswordInput = await page.$('input[name="password"]') !== null;
    const hasSubmitButton = await page.$('button[type="submit"]') !== null;
    
    console.log('\n📍 Form elements:');
    console.log(`   Email input: ${hasEmailInput ? '✅' : '❌'}`);
    console.log(`   Password input: ${hasPasswordInput ? '✅' : '❌'}`);
    console.log(`   Submit button: ${hasSubmitButton ? '✅' : '❌'}`);
    
    if (hasEmailInput && hasPasswordInput && hasSubmitButton) {
      console.log('\n🎉 DONOR AUTH FORM IS WORKING!');
    }
    
    await page.screenshot({ path: 'correct-app-test.png' });
    console.log('\n📸 Screenshot saved as correct-app-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCorrectApp();