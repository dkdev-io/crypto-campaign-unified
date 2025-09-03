import puppeteer from 'puppeteer';

async function createTestAccount() {
  console.log('🆕 CREATING TEST ACCOUNT: test@dkdev.io');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      console.log(`📤 ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase')) {
      console.log(`📥 ${response.status()} ${response.url()}`);
    }
  });
  
  page.on('console', msg => {
    console.log(`🖥️  ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('\n🚀 Step 1: Load signup page');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📝 Step 2: Switch to Sign Up tab');
    
    // Find and click Sign Up tab
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Look for Sign Up button/tab
    const buttons = await page.$$('button');
    let signupButton = null;
    
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Sign Up')) {
        signupButton = button;
        break;
      }
    }
    
    if (signupButton) {
      console.log('✅ Found Sign Up tab, clicking...');
      await signupButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('❌ Could not find Sign Up tab');
      throw new Error('Sign Up tab not found');
    }
    
    console.log('\n✍️  Step 3: Fill signup form');
    
    // Fill out signup form
    const fullNameField = await page.$('input[name="fullName"]');
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    const confirmPasswordField = await page.$('input[name="confirmPassword"]');
    
    if (fullNameField) await page.type('input[name="fullName"]', 'Test User');
    if (emailField) {
      await page.click('input[name="email"]', { clickCount: 3 });
      await page.type('input[name="email"]', 'test@dkdev.io');
    }
    if (passwordField) {
      await page.click('input[name="password"]', { clickCount: 3 });
      await page.type('input[name="password"]', 'TestPassword123!');
    }
    if (confirmPasswordField) {
      await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    }
    
    console.log('✅ Signup form filled');
    
    // Take screenshot before submit
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/create-account-form.png',
      fullPage: true 
    });
    
    console.log('\n🚀 Step 4: Submit signup');
    
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Take screenshot after submit
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/create-account-result.png',
      fullPage: true 
    });
    
    console.log('\n📧 Step 5: Check for verification message');
    
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasVerificationMessage = pageText.includes('check your email') ||
                                  pageText.includes('verification') ||
                                  pageText.includes('Account created');
    
    console.log(`Has verification message: ${hasVerificationMessage}`);
    
    if (hasVerificationMessage) {
      console.log('✅ Account creation appears successful!');
      console.log('📧 Check email for verification link');
      return true;
    } else {
      console.log('❌ Account creation may have failed');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Account creation failed:', error.message);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/create-account-error.png',
      fullPage: true 
    });
    
    return false;
  } finally {
    console.log('\n⏸️  Keeping browser open for inspection...');
    // Don't close browser - keep it open for manual verification
  }
}

createTestAccount().then(success => {
  console.log(`\n🏁 ACCOUNT CREATION: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('🔍 Check screenshots and browser for details');
  
  if (success) {
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check email for verification link');  
    console.log('2. Click verification link');
    console.log('3. Test login with test@dkdev.io / TestPassword123!');
    console.log('4. Test full setup workflow');
  }
});