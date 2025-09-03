import puppeteer from 'puppeteer';

async function testRealAuth() {
  console.log('🔍 TESTING ACTUAL AUTHENTICATION');
  console.log('Testing if login form actually communicates with Supabase...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox'],
    devtools: true // Open devtools to see network requests
  });
  
  const page = await browser.newPage();
  
  // Capture all network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
    console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`🖥️  BROWSER: ${msg.type()} - ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('\n🚀 Step 1: Load campaign setup page');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-test-initial.png',
      fullPage: true 
    });
    
    console.log('\n🔐 Step 2: Try to login with test@dkdev.io');
    
    // Fill the form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'test@dkdev.io');
    
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'TestPassword123!');
    
    console.log('✅ Form filled with test@dkdev.io');
    
    // Take screenshot before submit
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-test-filled.png',
      fullPage: true 
    });
    
    // Submit the form and monitor network activity
    console.log('\n📡 Step 3: Submit form and monitor network requests');
    
    await page.click('button[type="submit"]');
    
    // Wait longer to see all network activity
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Take screenshot after submit
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-test-after-submit.png',
      fullPage: true 
    });
    
    console.log('\n📊 Step 4: Analyze what happened');
    
    // Check if any Supabase requests were made
    const supabaseRequests = requests.filter(req => 
      req.url.includes('supabase') || 
      req.url.includes('gotrue') ||
      req.url.includes('auth')
    );
    
    console.log(`🔍 Supabase requests made: ${supabaseRequests.length}`);
    supabaseRequests.forEach(req => {
      console.log(`  - ${req.method} ${req.url}`);
    });
    
    // Check for auth-related responses
    const authResponses = responses.filter(resp => 
      resp.url.includes('supabase') || 
      resp.url.includes('gotrue') ||
      resp.url.includes('auth')
    );
    
    console.log(`🔍 Auth responses received: ${authResponses.length}`);
    authResponses.forEach(resp => {
      console.log(`  - ${resp.status} ${resp.url}`);
    });
    
    // Check if form shows any error messages
    const pageText = await page.evaluate(() => document.body.textContent);
    const hasErrorMessage = pageText.includes('No account found') ||
                           pageText.includes('Invalid') ||
                           pageText.includes('error') ||
                           pageText.includes('failed');
    
    console.log(`❌ Shows error message: ${hasErrorMessage}`);
    
    if (hasErrorMessage) {
      // Look for specific error text
      const errorElement = await page.$('.text-destructive, .error, [class*="error"]');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log(`Error message: "${errorText}"`);
      }
    }
    
    // Check current URL to see if anything changed
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    console.log('\n📋 Step 5: Test account creation');
    
    // Try to switch to signup tab if it exists
    try {
      const signupTab = await page.$('button:contains("Sign Up")') || 
                       await page.$('[role="tab"]:contains("Sign Up")') ||
                       await page.$('button[type="button"]');
      
      if (signupTab) {
        console.log('🆕 Found signup option, testing account creation...');
        
        // Click signup tab/button
        await signupTab.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to create account
        const hasFullNameField = await page.$('input[name="fullName"]') !== null;
        console.log(`Has full name field for signup: ${hasFullNameField}`);
        
        if (hasFullNameField) {
          await page.type('input[name="fullName"]', 'Test User');
          await page.type('input[name="email"]', 'test@dkdev.io');  
          await page.type('input[name="password"]', 'TestPassword123!');
          
          const confirmPasswordField = await page.$('input[name="confirmPassword"]');
          if (confirmPasswordField) {
            await page.type('input[name="confirmPassword"]', 'TestPassword123!');
          }
          
          // Submit signup
          await page.click('button[type="submit"]');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Take screenshot after signup attempt
          await page.screenshot({ 
            path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-test-signup.png',
            fullPage: true 
          });
        }
      }
    } catch (error) {
      console.log('Could not test signup:', error.message);
    }
    
    // Final analysis
    const authWorking = supabaseRequests.length > 0 || authResponses.length > 0;
    
    console.log(`\n🎯 AUTHENTICATION ANALYSIS:`);
    console.log(`Network requests to Supabase: ${supabaseRequests.length > 0 ? '✅' : '❌'}`);
    console.log(`Authentication responses: ${authResponses.length > 0 ? '✅' : '❌'}`);
    console.log(`Form communication working: ${authWorking ? '✅' : '❌'}`);
    
    return {
      working: authWorking,
      supabaseRequests: supabaseRequests.length,
      authResponses: authResponses.length,
      hasErrors: hasErrorMessage,
      currentUrl: currentUrl
    };
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/auth-test-error.png',
      fullPage: true 
    });
    
    return { working: false, error: error.message };
    
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser staying open for manual inspection...');
    console.log('Close browser manually when done inspecting');
    // Don't close browser automatically
    // await browser.close();
  }
}

testRealAuth().then(result => {
  console.log('\n🏁 AUTHENTICATION TEST COMPLETE');
  console.log(`Working: ${result.working ? '✅' : '❌'}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  
  // Don't exit automatically so browser stays open
  // process.exit(result.working ? 0 : 1);
});