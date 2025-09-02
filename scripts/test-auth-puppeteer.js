#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testAuthFlow() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing auth flow at https://cryptocampaign.netlify.app');
    
    // Navigate to the site
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('📄 Page loaded successfully');
    
    // Take initial screenshot
    await page.screenshot({ path: 'scripts/auth-test-1-initial.png' });
    console.log('📸 Screenshot saved: auth-test-1-initial.png');
    
    // Check if signin form is visible and switch to signin tab
    await page.waitForSelector('button', { timeout: 5000 });
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Sign In')) {
        await button.click();
        console.log('🔄 Clicked Sign In tab');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔑 Testing signin with dan@dkdev.io...');
    
    // Fill in signin form
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 5000 });
    await page.type('input[name="email"], input[type="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"], input[type="password"]', '321test!');
    
    // Take screenshot before submit
    await page.screenshot({ path: 'scripts/auth-test-2-signin-filled.png' });
    console.log('📸 Screenshot saved: auth-test-2-signin-filled.png');
    
    // Click signin button
    const signinButton = await page.$('button[type="submit"]');
    if (signinButton) {
      await signinButton.click();
      console.log('🔄 Clicked signin button');
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot after signin attempt
      await page.screenshot({ path: 'scripts/auth-test-3-signin-result.png' });
      console.log('📸 Screenshot saved: auth-test-3-signin-result.png');
      
      // Check for error messages or success
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Look for error messages
      const errorElements = await page.$$('.text-destructive, .error, .alert');
      for (let errorEl of errorElements) {
        const text = await errorEl.evaluate(el => el.textContent);
        if (text.trim()) {
          console.log(`❌ Error found: ${text}`);
        }
      }
      
      // Check if user was redirected (successful login)
      if (currentUrl.includes('/setup') || currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful - redirected to protected page');
      } else if (currentUrl.includes('auth')) {
        console.log('⚠️ Still on auth page - checking for messages...');
        
        // Look for any messages on page
        const messages = await page.evaluate(() => {
          const elements = document.querySelectorAll('p, div, span');
          return Array.from(elements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 10 && (
              text.includes('email') || 
              text.includes('account') || 
              text.includes('verification') ||
              text.includes('check') ||
              text.includes('create')
            ));
        });
        
        messages.forEach(msg => console.log(`💬 Message: ${msg}`));
      }
    }
    
    console.log('\n🧪 Now testing signup flow...');
    
    // Switch to signup tab
    const signupButtons = await page.$$('button');
    for (let button of signupButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text.includes('Sign Up')) {
        await button.click();
        console.log('📝 Switched to signup tab');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear any existing values and fill signup form
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => input.value = '');
    });
    
    await page.waitForSelector('input[name="fullName"], input[placeholder*="name"]', { timeout: 5000 });
    await page.type('input[name="fullName"], input[placeholder*="name"]', 'Test User');
    await page.type('input[name="email"], input[type="email"]', 'dan@dkdev.io');
    await page.type('input[name="password"]:not([name="confirmPassword"])', '321test!');
    await page.type('input[name="confirmPassword"], input[placeholder*="confirm"]', '321test!');
    
    // Check terms checkbox if exists
    const checkbox = await page.$('input[type="checkbox"]');
    if (checkbox) {
      await checkbox.click();
      console.log('✅ Agreed to terms');
    }
    
    // Take screenshot before signup submit
    await page.screenshot({ path: 'scripts/auth-test-4-signup-filled.png' });
    console.log('📸 Screenshot saved: auth-test-4-signup-filled.png');
    
    // Click signup button
    const signupButton = await page.$('button[type="submit"]');
    if (signupButton) {
      await signupButton.click();
      console.log('🔄 Clicked signup button');
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Take screenshot after signup
      await page.screenshot({ path: 'scripts/auth-test-5-signup-result.png' });
      console.log('📸 Screenshot saved: auth-test-5-signup-result.png');
      
      // Check what happened after signup
      const finalUrl = page.url();
      console.log(`📍 Final URL: ${finalUrl}`);
      
      // Look for verification message
      const allText = await page.evaluate(() => document.body.textContent);
      
      if (allText.includes('check your email') || allText.includes('Check Your Email') || allText.includes('verification')) {
        console.log('✅ SUCCESS: Email verification message displayed!');
        
        // Find the specific message
        const verificationMessages = await page.evaluate(() => {
          const elements = document.querySelectorAll('p, div, span, h2, h3');
          return Array.from(elements)
            .map(el => el.textContent.trim())
            .filter(text => text.toLowerCase().includes('email') || text.toLowerCase().includes('verification') || text.toLowerCase().includes('check'));
        });
        
        verificationMessages.forEach(msg => console.log(`📧 Verification message: ${msg}`));
        
      } else {
        console.log('❌ FAILED: No email verification message found');
        console.log('📝 Page content preview:');
        console.log(allText.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: 'scripts/auth-test-error.png' });
    console.log('📸 Error screenshot saved: auth-test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFlow().catch(console.error);