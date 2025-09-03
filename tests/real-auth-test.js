import puppeteer from 'puppeteer';

async function realAuthTest() {
  console.log('🔥 REAL AUTH TEST - Actually Testing Functionality\n');
  console.log('================================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  let results = {
    campaignSignup: false,
    campaignLogin: false,
    donorSignup: false,
    donorLogin: false,
    errors: []
  };
  
  try {
    // Test 1: Campaign Signup Flow
    console.log('1️⃣ Testing CAMPAIGN SIGNUP with REAL submission...\n');
    
    const page = await browser.newPage();
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click Sign Up tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signUpBtn = buttons.find(btn => btn.textContent.includes('Sign Up'));
      if (signUpBtn) signUpBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📝 Filling campaign signup form...');
    
    // Fill the form completely
    try {
      // Full name
      await page.type('input[name="fullName"]', 'Test Campaign User');
      console.log('   ✅ Name filled');
      
      // Email
      await page.type('input[name="email"]', 'test@dkdev.io');
      console.log('   ✅ Email filled');
      
      // Password
      await page.type('input[name="password"]', 'TestPassword123!');
      console.log('   ✅ Password filled');
      
      // Confirm Password
      await page.type('input[name="confirmPassword"]', 'TestPassword123!');
      console.log('   ✅ Confirm password filled');
      
      // Accept terms
      await page.click('input[name="agreeToTerms"]');
      console.log('   ✅ Terms accepted');
      
      // Submit form
      console.log('🚀 SUBMITTING CAMPAIGN SIGNUP...');
      await page.click('button[type="submit"]');
      
      // Wait for response and check what happens
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentUrl = page.url();
      const pageText = await page.evaluate(() => document.body.textContent);
      
      console.log('Current URL:', currentUrl);
      
      if (pageText.includes('Account created') || pageText.includes('verification') || pageText.includes('email')) {
        console.log('   ✅ CAMPAIGN SIGNUP SUCCESS - Account created!');
        results.campaignSignup = true;
      } else if (pageText.includes('error') || pageText.includes('failed')) {
        console.log('   ❌ CAMPAIGN SIGNUP FAILED - Error found');
        console.log('   Error text:', pageText.substring(0, 200));
        results.errors.push('Campaign signup failed: ' + pageText.substring(0, 100));
      } else {
        console.log('   ⚠️ CAMPAIGN SIGNUP UNCLEAR - Taking screenshot');
        await page.screenshot({ path: 'campaign-signup-result.png' });
        console.log('   See screenshot: campaign-signup-result.png');
      }
      
    } catch (error) {
      console.log('   ❌ CAMPAIGN SIGNUP ERROR:', error.message);
      results.errors.push('Campaign signup error: ' + error.message);
    }
    
    await page.close();
    
    // Test 2: Donor Signup Flow
    console.log('\n2️⃣ Testing DONOR SIGNUP with REAL submission...\n');
    
    const donorPage = await browser.newPage();
    await donorPage.goto('https://cryptocampaign.netlify.app/donors/auth');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click Sign Up tab
    await donorPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signUpBtn = buttons.find(btn => btn.textContent.includes('Sign Up'));
      if (signUpBtn) signUpBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📝 Filling donor signup form...');
    
    try {
      // Full name
      await donorPage.type('input[name="fullName"]', 'Test Donor User');
      console.log('   ✅ Name filled');
      
      // Email
      await donorPage.type('input[name="email"]', 'test@dkdev.io');
      console.log('   ✅ Email filled');
      
      // Phone (optional)
      const phoneField = await donorPage.$('input[name="phone"]');
      if (phoneField) {
        await donorPage.type('input[name="phone"]', '555-0123');
        console.log('   ✅ Phone filled');
      }
      
      // Password
      await donorPage.type('input[name="password"]', 'TestPassword123!');
      console.log('   ✅ Password filled');
      
      // Confirm Password
      await donorPage.type('input[name="confirmPassword"]', 'TestPassword123!');
      console.log('   ✅ Confirm password filled');
      
      // Accept terms
      await donorPage.click('input[name="agreeToTerms"]');
      console.log('   ✅ Terms accepted');
      
      // Submit form
      console.log('🚀 SUBMITTING DONOR SIGNUP...');
      await donorPage.click('button[type="submit"]');
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentUrl = donorPage.url();
      const pageText = await donorPage.evaluate(() => document.body.textContent);
      
      console.log('Current URL:', currentUrl);
      
      if (currentUrl.includes('dashboard') || currentUrl.includes('verify-email')) {
        console.log('   ✅ DONOR SIGNUP SUCCESS - Redirected properly!');
        results.donorSignup = true;
      } else if (pageText.includes('verify') || pageText.includes('email')) {
        console.log('   ✅ DONOR SIGNUP SUCCESS - Verification message shown!');
        results.donorSignup = true;
      } else if (pageText.includes('error') || pageText.includes('failed')) {
        console.log('   ❌ DONOR SIGNUP FAILED - Error found');
        console.log('   Error text:', pageText.substring(0, 200));
        results.errors.push('Donor signup failed: ' + pageText.substring(0, 100));
      } else {
        console.log('   ⚠️ DONOR SIGNUP UNCLEAR - Taking screenshot');
        await donorPage.screenshot({ path: 'donor-signup-result.png' });
        console.log('   See screenshot: donor-signup-result.png');
      }
      
    } catch (error) {
      console.log('   ❌ DONOR SIGNUP ERROR:', error.message);
      results.errors.push('Donor signup error: ' + error.message);
    }
    
    await donorPage.close();
    
    // Test 3: Try Login (if signup worked)
    if (results.campaignSignup || results.donorSignup) {
      console.log('\n3️⃣ Testing LOGIN functionality...\n');
      
      const loginPage = await browser.newPage();
      await loginPage.goto('https://cryptocampaign.netlify.app/campaigns/auth');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Try to sign in with the same credentials
        await loginPage.type('input[name="email"]', 'test@dkdev.io');
        await loginPage.type('input[name="password"]', 'TestPassword123!');
        
        console.log('🔑 Attempting login...');
        await loginPage.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const loginUrl = loginPage.url();
        const loginText = await loginPage.evaluate(() => document.body.textContent);
        
        if (loginUrl.includes('setup') || loginUrl.includes('dashboard')) {
          console.log('   ✅ LOGIN SUCCESS - Redirected to dashboard!');
          results.campaignLogin = true;
        } else {
          console.log('   ⚠️ LOGIN UNCLEAR - URL:', loginUrl);
        }
        
      } catch (error) {
        console.log('   ❌ LOGIN ERROR:', error.message);
        results.errors.push('Login error: ' + error.message);
      }
      
      await loginPage.close();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 REAL TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log('\nWHAT ACTUALLY WORKS:');
    console.log('Campaign Signup:', results.campaignSignup ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Campaign Login:', results.campaignLogin ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Donor Signup:', results.donorSignup ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Donor Login:', results.donorLogin ? '✅ SUCCESS' : '❌ FAILED');
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      results.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    const totalWorking = Object.values(results).filter(Boolean).length - results.errors.length;
    if (totalWorking === 0) {
      console.log('\n🚨 NOTHING IS ACTUALLY WORKING!');
    } else if (totalWorking < 2) {
      console.log('\n⚠️ MAJOR ISSUES - Most functionality broken');
    } else {
      console.log('\n✅ Some functionality working, but needs fixes');
    }
    
    console.log('\n⏰ Keeping browser open for 10 seconds to see results...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    results.errors.push('Fatal error: ' + error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

realAuthTest()
  .then((results) => {
    const working = Object.values(results).filter(Boolean).length - results.errors.length;
    if (working > 0) {
      console.log('\n✅ Test completed - see results above');
    } else {
      console.log('\n❌ Test completed - NOTHING WORKING');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });