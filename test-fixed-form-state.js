import puppeteer from 'puppeteer';

async function testFixedFormState() {
  console.log('🔧 TESTING FIXED FORM STATE MANAGEMENT');
  console.log('Testing if conflicting success/error messages are resolved...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('\n🚀 Step 1: Load page and try login with non-existent user');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try login with non-existent account to generate error
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'nonexistent@test.com');
    
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot showing error
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/test-error-state.png',
      fullPage: true 
    });
    
    console.log('✅ Generated error message');
    
    console.log('\n🔄 Step 2: Switch to Sign Up tab (should clear errors)');
    
    // Find and click Sign Up tab
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Sign Up')) {
        await button.click();
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot after tab switch
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/test-tab-switch.png',
      fullPage: true 
    });
    
    console.log('\n📝 Step 3: Try creating account');
    
    // Fill signup form
    await page.type('input[name="fullName"]', 'Test User');
    await page.type('input[name="email"]', 'test123@dkdev.io');
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    
    // Submit signup
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Take screenshot after signup attempt
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/test-signup-result.png',
      fullPage: true 
    });
    
    console.log('\n🔍 Step 4: Check for conflicting messages');
    
    const pageText = await page.evaluate(() => document.body.textContent);
    
    const hasSuccessMessage = pageText.includes('Account created') || 
                             pageText.includes('check your email');
                             
    const hasErrorMessage = pageText.includes('No account found') ||
                           pageText.includes('Invalid') ||
                           pageText.includes('error');
    
    console.log(`Has success message: ${hasSuccessMessage}`);
    console.log(`Has error message: ${hasErrorMessage}`);
    console.log(`Both messages showing: ${hasSuccessMessage && hasErrorMessage}`);
    
    console.log('\n🔄 Step 5: Test tab switching clears messages');
    
    // Switch back to Sign In
    const signInButtons = await page.$$('button');
    for (let button of signInButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Sign In') && !text.includes('Sign Up')) {
        await button.click();
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/test-final-state.png',
      fullPage: true 
    });
    
    const finalPageText = await page.evaluate(() => document.body.textContent);
    const hasMessagesAfterSwitch = finalPageText.includes('Account created') ||
                                  finalPageText.includes('No account found') ||
                                  finalPageText.includes('error');
    
    console.log(`Messages cleared after tab switch: ${!hasMessagesAfterSwitch}`);
    
    const isFixed = !hasMessagesAfterSwitch && !(hasSuccessMessage && hasErrorMessage);
    
    console.log(`\n🎯 FORM STATE MANAGEMENT: ${isFixed ? '✅ FIXED' : '❌ STILL BROKEN'}`);
    
    return isFixed;
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/test-state-error.png',
      fullPage: true 
    });
    
    return false;
  } finally {
    console.log('\n⏸️  Browser staying open for inspection...');
    // Don't close automatically for manual verification
  }
}

testFixedFormState().then(success => {
  console.log(`\n🏁 FORM STATE FIX: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
});