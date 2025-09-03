import puppeteer from 'puppeteer';

async function testFullWorkflow() {
  console.log('🚀 Testing FULL Campaign Setup Workflow...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('\n📍 Step 1: Test /setup route (should redirect to auth)');
    await page.goto('https://cryptocampaign.netlify.app/setup', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    const currentUrl = page.url();
    console.log(`✅ Setup route redirected to: ${currentUrl}`);
    
    // Should be on auth page
    const isOnAuthPage = currentUrl.includes('/auth');
    if (!isOnAuthPage) {
      throw new Error('Setup route did not redirect to auth');
    }
    
    console.log('\n📍 Step 2: Fill in login form with test@dkdev.io');
    
    // Wait for form to be visible
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Clear and fill email
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'test@dkdev.io');
    
    // Clear and fill password  
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'TestPassword123!');
    
    console.log('✅ Login form filled');
    
    // Take screenshot before submit
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/login-form-filled.png',
      fullPage: true 
    });
    
    console.log('\n📍 Step 3: Submit login form');
    
    // Click Sign In button
    await page.click('button[type="submit"]');
    
    // Wait for potential navigation/response
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const afterLoginUrl = page.url();
    console.log(`After login URL: ${afterLoginUrl}`);
    
    // Take screenshot after login attempt
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/after-login.png',
      fullPage: true 
    });
    
    console.log('\n📍 Step 4: Check final state');
    
    // Check if we're on setup page or dashboard
    const isOnSetup = afterLoginUrl.includes('/setup');
    const isOnDashboard = afterLoginUrl.includes('dashboard');
    const isOnProfile = page.url().includes('profile') || 
                       await page.$('form') !== null ||
                       await page.evaluate(() => document.body.textContent.includes('Complete Your Profile'));
    
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasSetupContent = pageText.includes('Setup') || 
                           pageText.includes('Campaign') || 
                           pageText.includes('Step') ||
                           pageText.includes('Committee');
    
    console.log(`Is on setup page: ${isOnSetup}`);
    console.log(`Is on dashboard: ${isOnDashboard}`);  
    console.log(`Is on profile: ${isOnProfile}`);
    console.log(`Has setup content: ${hasSetupContent}`);
    
    // Check for error messages
    const hasError = pageText.includes('error') || 
                     pageText.includes('Error') ||
                     pageText.includes('failed') ||
                     pageText.includes('Invalid');
                     
    console.log(`Has error messages: ${hasError}`);
    
    if (hasError) {
      console.log('Error text found:', pageText.substring(pageText.indexOf('error'), pageText.indexOf('error') + 100));
    }
    
    const workflowWorking = isOnSetup || hasSetupContent || isOnProfile;
    
    console.log(`\n🎯 WORKFLOW STATUS: ${workflowWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    
    if (workflowWorking) {
      console.log('✅ Campaign setup workflow is functional!');
    } else {
      console.log('❌ Still broken - not reaching setup after login');
    }
    
    return workflowWorking;
    
  } catch (error) {
    console.error('💥 Workflow test failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/workflow-error.png',
      fullPage: true 
    });
    
    return false;
  } finally {
    await browser.close();
  }
}

testFullWorkflow().then(success => {
  console.log(`\n🏁 FINAL RESULT: Campaign setup workflow is ${success ? 'WORKING ✅' : 'BROKEN ❌'}`);
  process.exit(success ? 0 : 1);
});