import puppeteer from 'puppeteer';

async function testDonorAuthScreen() {
  let browser;
  
  try {
    console.log('🚀 Starting Puppeteer test for donor auth screen...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Enable request interception to log network requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      console.log('📡 Request:', request.method(), request.url());
      request.continue();
    });
    
    // Log console messages
    page.on('console', (msg) => {
      console.log('🖥️  Browser console:', msg.text());
    });
    
    // Test 1: Navigate to home page
    console.log('\n📍 Step 1: Navigate to home page');
    await page.goto('http://localhost:5176', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check if Donors button exists in header
    console.log('\n📍 Step 2: Check for Donors button in header');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on page`);
    
    let donorButtonFound = false;
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].evaluate(el => el.textContent);
      console.log(`Button ${i}: "${buttonText}"`);
      if (buttonText && buttonText.includes('Donors')) {
        console.log('✅ Found Donors button via text search');
        donorButtonFound = true;
        break;
      }
    }
    
    if (!donorButtonFound) {
      console.log('❌ Donors button not found');
    }
    
    // Test 3: Click Donors button
    console.log('\n📍 Step 3: Click Donors button');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const donorButton = buttons.find(button => button.textContent.includes('Donors'));
      if (donorButton) {
        console.log('Clicking donor button...');
        donorButton.click();
      } else {
        throw new Error('Donors button not found!');
      }
    });
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Verify we're on donor auth page
    console.log('\n📍 Step 4: Verify donor auth page loaded');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/donors/auth')) {
      console.log('✅ Successfully navigated to donor auth page');
    } else {
      console.log('❌ Did not navigate to donor auth page, current URL:', currentUrl);
    }
    
    // Test 5: Check for auth screen elements
    console.log('\n📍 Step 5: Check for auth screen elements');
    
    // Check for "Donor Portal" heading
    const heading = await page.$('h1');
    if (heading) {
      const headingText = await heading.evaluate(el => el.textContent);
      console.log('Found heading:', headingText);
      if (headingText.includes('Donor Portal')) {
        console.log('✅ Donor Portal heading found');
      }
    }
    
    // Check for Sign In/Sign Up tabs
    const signInTab = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(button => button.textContent.includes('Sign In'));
    });
    
    const signUpTab = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(button => button.textContent.includes('Sign Up'));
    });
    
    console.log('Sign In tab found:', signInTab ? '✅' : '❌');
    console.log('Sign Up tab found:', signUpTab ? '✅' : '❌');
    
    // Test 6: Check for bypass button
    console.log('\n📍 Step 6: Check for development bypass button');
    const bypassButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(button => 
        button.textContent.includes('DEV BYPASS') || 
        button.textContent.includes('BYPASS')
      );
    });
    
    console.log('Bypass button found:', bypassButton ? '✅' : '❌');
    
    if (bypassButton) {
      console.log('\n📍 Step 7: Test bypass button functionality');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const bypassBtn = buttons.find(button => 
          button.textContent.includes('DEV BYPASS') || 
          button.textContent.includes('BYPASS')
        );
        if (bypassBtn) {
          console.log('Clicking bypass button...');
          bypassBtn.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      const newUrl = page.url();
      console.log('URL after bypass click:', newUrl);
      
      if (newUrl.includes('/donors/dashboard')) {
        console.log('✅ Bypass button successfully navigated to dashboard');
      } else {
        console.log('❌ Bypass button did not navigate to dashboard');
      }
    }
    
    // Test 7: Take screenshot
    console.log('\n📍 Step 8: Take screenshot for verification');
    await page.screenshot({ 
      path: 'donor-auth-test.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as donor-auth-test.png');
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testDonorAuthScreen();