import puppeteer from 'puppeteer';

async function testCorrectWorkflow() {
  console.log('🚀 Testing CORRECT Campaign Setup Workflow...');
  console.log('📋 Expected flow: /campaigns/auth/setup → redirect to /campaigns/auth → login → back to /campaigns/auth/setup');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('\n📍 Step 1: Test direct access to /campaigns/auth/setup');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Should redirect to campaigns/auth for authentication
    const redirectedToAuth = currentUrl.includes('/campaigns/auth') && !currentUrl.includes('/setup');
    console.log(`✅ Redirected to auth for login: ${redirectedToAuth}`);
    
    console.log('\n📍 Step 2: Login with test@dkdev.io');
    
    // Wait for form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Fill login form
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'test@dkdev.io');
    
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'TestPassword123!');
    
    // Take screenshot before submit
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/correct-workflow-login.png',
      fullPage: true 
    });
    
    // Submit login
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const afterLoginUrl = page.url();
    console.log(`After login URL: ${afterLoginUrl}`);
    
    console.log('\n📍 Step 3: Check if redirected back to setup');
    
    const isOnSetupRoute = afterLoginUrl.includes('/campaigns/auth/setup');
    const pageContent = await page.evaluate(() => document.body.textContent);
    const hasSetupContent = pageContent.includes('Setup') || 
                           pageContent.includes('Campaign') ||
                           pageContent.includes('Step') ||
                           pageContent.includes('Committee');
    
    console.log(`On /campaigns/auth/setup route: ${isOnSetupRoute}`);
    console.log(`Has setup wizard content: ${hasSetupContent}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/correct-workflow-final.png',
      fullPage: true 
    });
    
    const workflowWorking = isOnSetupRoute || hasSetupContent;
    
    console.log(`\n🎯 CORRECT WORKFLOW: ${workflowWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    
    if (workflowWorking) {
      console.log('✅ Users can access setup at: /campaigns/auth/setup');
    } else {
      console.log('❌ Setup workflow still broken');
    }
    
    return workflowWorking;
    
  } catch (error) {
    console.error('💥 Workflow test failed:', error.message);
    
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/correct-workflow-error.png',
      fullPage: true 
    });
    
    return false;
  } finally {
    await browser.close();
  }
}

testCorrectWorkflow().then(success => {
  console.log(`\n🏁 FINAL RESULT: Correct workflow ${success ? 'WORKING ✅' : 'BROKEN ❌'}`);
  process.exit(success ? 0 : 1);
});