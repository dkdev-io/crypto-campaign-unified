import puppeteer from 'puppeteer';

async function verifyFinalWorkflow() {
  console.log('🔍 FINAL VERIFICATION: Campaign Setup Workflow');
  console.log('📍 Testing: cryptocampaign.netlify.app/campaigns/auth/setup');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture console logs and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('\n🚀 Step 1: Load /campaigns/auth/setup');
    
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const url1 = page.url();
    console.log(`Current URL: ${url1}`);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/verify-step1.png',
      fullPage: true 
    });
    
    // Check if we have login form (expected for unauthenticated user)
    const hasEmailField = await page.$('input[name="email"]') !== null;
    const hasPasswordField = await page.$('input[name="password"]') !== null;
    const hasLoginButton = await page.$('button[type="submit"]') !== null;
    
    console.log(`✅ Has email field: ${hasEmailField}`);
    console.log(`✅ Has password field: ${hasPasswordField}`);
    console.log(`✅ Has login button: ${hasLoginButton}`);
    
    if (!hasEmailField || !hasPasswordField) {
      throw new Error('Login form not found - workflow broken');
    }
    
    console.log('\n🔐 Step 2: Login with test@dkdev.io');
    
    // Fill login form
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'test@dkdev.io');
    
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'TestPassword123!');
    
    console.log('✅ Form filled');
    
    // Take screenshot before submit
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/verify-step2.png',
      fullPage: true 
    });
    
    // Submit login
    await page.click('button[type="submit"]');
    console.log('✅ Login submitted');
    
    // Wait for response/redirect
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const url2 = page.url();
    console.log(`After login URL: ${url2}`);
    
    console.log('\n🛠️  Step 3: Verify Setup Wizard Access');
    
    // Check if we're still on the same URL
    const stayedOnSetupUrl = url2.includes('/campaigns/auth/setup');
    console.log(`✅ Stayed on setup URL: ${stayedOnSetupUrl}`);
    
    // Check for setup wizard content
    const pageText = await page.evaluate(() => document.body.textContent);
    
    const setupIndicators = {
      hasSetupText: pageText.includes('Setup') || pageText.includes('setup'),
      hasCampaignText: pageText.includes('Campaign') || pageText.includes('campaign'),
      hasStepText: pageText.includes('Step') || pageText.includes('step'),
      hasCommitteeText: pageText.includes('Committee') || pageText.includes('committee'),
      hasWizardElements: await page.$('.setup-container') !== null ||
                         await page.$('.setup-card') !== null ||
                         await page.$('.step-indicator') !== null,
      hasProgressIndicator: await page.$('[class*="step"]') !== null,
      hasNextButton: await page.$('button:contains("Next")') !== null ||
                     await page.$('button[type="submit"]') !== null
    };
    
    console.log('Setup Wizard Indicators:', setupIndicators);
    
    // Check for error states
    const hasErrors = pageText.includes('error') || 
                     pageText.includes('Error') ||
                     pageText.includes('failed') ||
                     pageText.includes('not found');
    
    console.log(`❌ Has error messages: ${hasErrors}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/verify-step3.png',
      fullPage: true 
    });
    
    console.log('\n📊 Step 4: Final Assessment');
    
    const workflowWorking = stayedOnSetupUrl && 
                           (setupIndicators.hasSetupText || 
                            setupIndicators.hasCampaignText || 
                            setupIndicators.hasWizardElements) &&
                           !hasErrors;
    
    console.log(`\n🎯 FINAL ASSESSMENT: ${workflowWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    
    if (workflowWorking) {
      console.log('✅ Campaign setup workflow is fully functional!');
      console.log(`✅ Users can access setup at: ${url2}`);
      console.log('✅ Login → Setup transition works correctly');
    } else {
      console.log('❌ Campaign setup workflow is still broken');
      console.log('❌ Issues found during verification');
    }
    
    // Log any console errors
    if (errors.length > 0) {
      console.log('\n⚠️  JavaScript Errors Found:');
      errors.forEach(error => console.log(`- ${error}`));
    }
    
    return {
      working: workflowWorking,
      url: url2,
      indicators: setupIndicators,
      errors: errors,
      logs: logs.slice(-5) // Last 5 logs
    };
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '/Users/Danallovertheplace/crypto-campaign-unified/verify-error.png',
      fullPage: true 
    });
    
    return {
      working: false,
      error: error.message,
      logs: logs,
      errors: errors
    };
  } finally {
    await browser.close();
  }
}

verifyFinalWorkflow().then(result => {
  console.log('\n🏁 VERIFICATION COMPLETE');
  console.log(`Status: ${result.working ? '✅ WORKING' : '❌ BROKEN'}`);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  
  process.exit(result.working ? 0 : 1);
});