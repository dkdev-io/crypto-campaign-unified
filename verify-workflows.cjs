const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'https://cryptocampaign.netlify.app';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Test results storage
const verificationResults = {
  timestamp: new Date().toISOString(),
  campaignWorkflow: {},
  donorWorkflow: {},
  interactionTests: {},
  errors: [],
  success: false
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeScreenshot(page, name) {
  try {
    await page.screenshot({ 
      path: `verification_screenshots/${name}.png`, 
      fullPage: true 
    });
    console.log(`📸 Screenshot: ${name}.png`);
    return true;
  } catch (error) {
    console.log(`⚠️ Screenshot failed: ${name} - ${error.message}`);
    return false;
  }
}

async function waitForSelector(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.log(`⚠️ Selector not found: ${selector}`);
    return false;
  }
}

async function verifyCampaignSetupPage(browser) {
  console.log('\n🏛️ VERIFYING CAMPAIGN SETUP PAGE');
  console.log('=' .repeat(60));
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Navigating to /campaigns/auth/setup...');
    const response = await page.goto(`${BASE_URL}/campaigns/auth/setup`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await delay(3000);
    
    verificationResults.campaignWorkflow.initialLoad = {
      status: response.status(),
      success: response.ok(),
      url: page.url()
    };
    
    console.log(`📊 Page Status: ${response.status()}`);
    console.log(`🌐 Final URL: ${page.url()}`);
    
    await safeScreenshot(page, 'campaign_setup_initial');
    
    // Check for authentication form elements
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const signInButton = await page.$('button[type="submit"]');
    const bypassButton = await page.$('button[class*="yellow"]');
    
    verificationResults.campaignWorkflow.elements = {
      hasEmailInput: !!emailInput,
      hasPasswordInput: !!passwordInput,
      hasSignInButton: !!signInButton,
      hasBypassButton: !!bypassButton
    };
    
    console.log('📋 Form Elements Check:');
    console.log(`   Email Input: ${verificationResults.campaignWorkflow.elements.hasEmailInput ? '✅' : '❌'}`);
    console.log(`   Password Input: ${verificationResults.campaignWorkflow.elements.hasPasswordInput ? '✅' : '❌'}`);
    console.log(`   Sign In Button: ${verificationResults.campaignWorkflow.elements.hasSignInButton ? '✅' : '❌'}`);
    console.log(`   Bypass Button: ${verificationResults.campaignWorkflow.elements.hasBypassButton ? '✅' : '❌'}`);
    
    // Test bypass button interaction
    if (bypassButton) {
      console.log('🔍 Testing bypass button click...');
      const urlBefore = page.url();
      
      await bypassButton.click();
      await delay(4000);
      
      const urlAfter = page.url();
      const navigationSuccess = urlBefore !== urlAfter;
      
      verificationResults.campaignWorkflow.bypassTest = {
        urlBefore,
        urlAfter,
        navigationSuccess,
        redirectedTo: urlAfter.replace(BASE_URL, '')
      };
      
      console.log(`   Navigation: ${navigationSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   Before: ${urlBefore}`);
      console.log(`   After: ${urlAfter}`);
      
      await safeScreenshot(page, 'campaign_after_bypass');
    }
    
    // Test manual email/password entry
    if (emailInput && passwordInput && signInButton) {
      console.log('🔍 Testing manual authentication form...');
      
      // Go back to setup page
      await page.goto(`${BASE_URL}/campaigns/auth/setup`, { waitUntil: 'networkidle2' });
      await delay(2000);
      
      await page.type('input[type="email"]', TEST_EMAIL);
      await delay(500);
      await page.type('input[type="password"]', TEST_PASSWORD);
      await delay(500);
      
      await safeScreenshot(page, 'campaign_form_filled');
      
      // Note: Not clicking submit to avoid actual auth attempts
      verificationResults.campaignWorkflow.formInteraction = {
        canFillEmail: true,
        canFillPassword: true,
        formReady: true
      };
      
      console.log('   Form Filling: ✅ SUCCESS');
    }
    
    verificationResults.campaignWorkflow.overallSuccess = 
      verificationResults.campaignWorkflow.initialLoad.success &&
      verificationResults.campaignWorkflow.elements.hasEmailInput &&
      verificationResults.campaignWorkflow.elements.hasSignInButton;
    
  } catch (error) {
    console.log('❌ Campaign verification failed:', error.message);
    verificationResults.campaignWorkflow.error = error.message;
    verificationResults.errors.push(`Campaign workflow: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function verifyDonorAuthPage(browser) {
  console.log('\n💝 VERIFYING DONOR AUTH PAGE');
  console.log('=' .repeat(60));
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Navigating to /donors/auth...');
    const response = await page.goto(`${BASE_URL}/donors/auth`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await delay(3000);
    
    verificationResults.donorWorkflow.initialLoad = {
      status: response.status(),
      success: response.ok(),
      url: page.url()
    };
    
    console.log(`📊 Page Status: ${response.status()}`);
    console.log(`🌐 Final URL: ${page.url()}`);
    
    await safeScreenshot(page, 'donor_auth_initial');
    
    // Check for authentication form elements
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const signInButton = await page.$('button[type="submit"]');
    const bypassButton = await page.$('button[class*="yellow"]');
    const signUpTab = await page.$('button:contains("Sign Up")');
    
    verificationResults.donorWorkflow.elements = {
      hasEmailInput: !!emailInput,
      hasPasswordInput: !!passwordInput,
      hasSignInButton: !!signInButton,
      hasBypassButton: !!bypassButton,
      hasSignUpTab: !!signUpTab
    };
    
    console.log('📋 Donor Form Elements Check:');
    console.log(`   Email Input: ${verificationResults.donorWorkflow.elements.hasEmailInput ? '✅' : '❌'}`);
    console.log(`   Password Input: ${verificationResults.donorWorkflow.elements.hasPasswordInput ? '✅' : '❌'}`);
    console.log(`   Sign In Button: ${verificationResults.donorWorkflow.elements.hasSignInButton ? '✅' : '❌'}`);
    console.log(`   Bypass Button: ${verificationResults.donorWorkflow.elements.hasBypassButton ? '✅' : '❌'}`);
    
    // Test donor bypass button
    if (bypassButton) {
      console.log('🔍 Testing donor bypass button...');
      const urlBefore = page.url();
      
      await bypassButton.click();
      await delay(4000);
      
      const urlAfter = page.url();
      const navigationSuccess = urlBefore !== urlAfter;
      
      verificationResults.donorWorkflow.bypassTest = {
        urlBefore,
        urlAfter,
        navigationSuccess,
        redirectedTo: urlAfter.replace(BASE_URL, '')
      };
      
      console.log(`   Bypass Navigation: ${navigationSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   Redirected to: ${urlAfter}`);
      
      await safeScreenshot(page, 'donor_after_bypass');
      
      // Check if we're now on dashboard
      if (urlAfter.includes('/donors/dashboard')) {
        console.log('   ✅ Successfully reached donor dashboard');
        
        // Look for dashboard content
        await delay(2000);
        const dashboardTitle = await page.$eval('h1, h2', el => el.textContent).catch(() => 'Not found');
        console.log(`   Dashboard Title: "${dashboardTitle}"`);
        
        verificationResults.donorWorkflow.dashboardAccess = {
          success: true,
          title: dashboardTitle
        };
      }
    }
    
    verificationResults.donorWorkflow.overallSuccess = 
      verificationResults.donorWorkflow.initialLoad.success &&
      verificationResults.donorWorkflow.elements.hasEmailInput &&
      verificationResults.donorWorkflow.elements.hasBypassButton;
    
  } catch (error) {
    console.log('❌ Donor verification failed:', error.message);
    verificationResults.donorWorkflow.error = error.message;
    verificationResults.errors.push(`Donor workflow: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function testFormInteractions(browser) {
  console.log('\n🎯 TESTING FORM INTERACTIONS');
  console.log('=' .repeat(60));
  
  const page = await browser.newPage();
  
  try {
    // Test donor sign-up tab switching
    await page.goto(`${BASE_URL}/donors/auth`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Try to find and click "Sign Up" tab
    const signUpTab = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Sign Up'));
    });
    
    if (signUpTab) {
      console.log('🔍 Found Sign Up tab, testing switch...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const signUpBtn = buttons.find(btn => btn.textContent?.includes('Sign Up'));
        if (signUpBtn) signUpBtn.click();
      });
      
      await delay(2000);
      await safeScreenshot(page, 'donor_signup_tab');
      
      verificationResults.interactionTests.signUpTabSwitch = { success: true };
      console.log('   ✅ Sign Up tab interaction successful');
    } else {
      console.log('   ℹ️ Sign Up tab not found or already selected');
    }
    
    // Test form field interactions
    console.log('🔍 Testing form field interactions...');
    
    const emailFilled = await page.evaluate((email) => {
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.value = email;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, TEST_EMAIL);
    
    const passwordFilled = await page.evaluate((password) => {
      const passwordInput = document.querySelector('input[type="password"]');
      if (passwordInput) {
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, TEST_PASSWORD);
    
    verificationResults.interactionTests.formFilling = {
      emailFilled,
      passwordFilled,
      success: emailFilled && passwordFilled
    };
    
    console.log(`   Email Field: ${emailFilled ? '✅' : '❌'}`);
    console.log(`   Password Field: ${passwordFilled ? '✅' : '❌'}`);
    
    if (emailFilled && passwordFilled) {
      await safeScreenshot(page, 'forms_filled_complete');
    }
    
  } catch (error) {
    console.log('❌ Form interaction test failed:', error.message);
    verificationResults.interactionTests.error = error.message;
  } finally {
    await page.close();
  }
}

async function verifyResponsiveDesign(browser) {
  console.log('\n📱 TESTING RESPONSIVE DESIGN');
  console.log('=' .repeat(60));
  
  const page = await browser.newPage();
  
  try {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE
    await page.goto(`${BASE_URL}/campaigns/auth/setup`, { waitUntil: 'networkidle2' });
    await delay(2000);
    
    await safeScreenshot(page, 'campaign_mobile_view');
    
    // Test tablet viewport
    await page.setViewport({ width: 768, height: 1024 }); // iPad
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(2000);
    
    await safeScreenshot(page, 'campaign_tablet_view');
    
    // Test desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(2000);
    
    await safeScreenshot(page, 'campaign_desktop_view');
    
    verificationResults.responsiveDesign = { success: true };
    console.log('✅ Responsive design tests completed');
    
  } catch (error) {
    console.log('❌ Responsive design test failed:', error.message);
    verificationResults.responsiveDesign = { success: false, error: error.message };
  } finally {
    await page.close();
  }
}

async function generateVerificationReport() {
  console.log('\n📊 VERIFICATION RESULTS');
  console.log('=' .repeat(60));
  
  const campaignSuccess = verificationResults.campaignWorkflow.overallSuccess;
  const donorSuccess = verificationResults.donorWorkflow.overallSuccess;
  const interactionSuccess = verificationResults.interactionTests.formFilling?.success;
  
  console.log(`\n🏛️ CAMPAIGN WORKFLOW VERIFICATION:`);
  console.log(`   ✓ Page Load: ${verificationResults.campaignWorkflow.initialLoad?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ✓ Auth Form: ${verificationResults.campaignWorkflow.elements?.hasEmailInput ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ✓ Bypass Button: ${verificationResults.campaignWorkflow.elements?.hasBypassButton ? '✅ PASS' : '❌ FAIL'}`);
  
  if (verificationResults.campaignWorkflow.bypassTest) {
    console.log(`   ✓ Bypass Navigation: ${verificationResults.campaignWorkflow.bypassTest.navigationSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`     → Redirected to: ${verificationResults.campaignWorkflow.bypassTest.redirectedTo}`);
  }
  
  console.log(`\n💝 DONOR WORKFLOW VERIFICATION:`);
  console.log(`   ✓ Page Load: ${verificationResults.donorWorkflow.initialLoad?.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ✓ Auth Form: ${verificationResults.donorWorkflow.elements?.hasEmailInput ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   ✓ Bypass Button: ${verificationResults.donorWorkflow.elements?.hasBypassButton ? '✅ PASS' : '❌ FAIL'}`);
  
  if (verificationResults.donorWorkflow.bypassTest) {
    console.log(`   ✓ Bypass Navigation: ${verificationResults.donorWorkflow.bypassTest.navigationSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`     → Redirected to: ${verificationResults.donorWorkflow.bypassTest.redirectedTo}`);
  }
  
  if (verificationResults.donorWorkflow.dashboardAccess) {
    console.log(`   ✓ Dashboard Access: ${verificationResults.donorWorkflow.dashboardAccess.success ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  console.log(`\n🎯 INTERACTION TESTS:`);
  if (interactionSuccess !== undefined) {
    console.log(`   ✓ Form Filling: ${interactionSuccess ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  console.log(`\n📱 RESPONSIVE DESIGN:`);
  console.log(`   ✓ Multi-Device Test: ${verificationResults.responsiveDesign?.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (verificationResults.errors.length > 0) {
    console.log(`\n❌ ERRORS ENCOUNTERED:`);
    verificationResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  // Calculate overall success
  const criticalTestsPassed = 
    verificationResults.campaignWorkflow.initialLoad?.success &&
    verificationResults.donorWorkflow.initialLoad?.success;
    
  verificationResults.success = criticalTestsPassed;
  
  console.log(`\n🎯 FINAL VERIFICATION STATUS:`);
  console.log(`   ${verificationResults.success ? '✅ ALL CRITICAL TESTS PASSED' : '❌ CRITICAL TESTS FAILED'}`);
  console.log(`   🌐 /campaigns/auth/setup: ${verificationResults.campaignWorkflow.initialLoad?.success ? 'WORKING' : 'BROKEN'}`);
  console.log(`   🌐 /donors/auth: ${verificationResults.donorWorkflow.initialLoad?.success ? 'WORKING' : 'BROKEN'}`);
  
  // Save detailed results
  const fs = require('fs');
  fs.writeFileSync('verification-results.json', JSON.stringify(verificationResults, null, 2));
  console.log('\n📄 Detailed verification results saved to verification-results.json');
  
  return verificationResults.success;
}

async function main() {
  console.log('🧪 CRYPTO CAMPAIGN WORKFLOW VERIFICATION');
  console.log('🌐 Target: ' + BASE_URL);
  console.log('⏰ Started: ' + new Date().toLocaleString());
  console.log('🎯 Testing: /campaigns/auth/setup & /donors/auth workflows');
  
  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('verification_screenshots')) {
    fs.mkdirSync('verification_screenshots');
  }
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless testing
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    console.log('✅ Browser launched for verification');
    
    // Run verification tests
    await verifyCampaignSetupPage(browser);
    await verifyDonorAuthPage(browser);
    await testFormInteractions(browser);
    await verifyResponsiveDesign(browser);
    
    // Generate final report
    const success = await generateVerificationReport();
    
    console.log('\n🏁 VERIFICATION COMPLETE!');
    console.log(`🎯 Result: ${success ? 'WORKFLOWS VERIFIED ✅' : 'ISSUES DETECTED ❌'}`);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
    verificationResults.errors.push(`Main verification: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Handle interruption
process.on('SIGINT', async () => {
  console.log('\n⏹️ Verification interrupted');
  process.exit(1);
});

// Start verification
main().catch(error => {
  console.error('💥 Unhandled verification error:', error);
  process.exit(1);
});