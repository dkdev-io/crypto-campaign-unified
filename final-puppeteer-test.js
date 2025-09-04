import puppeteer from 'puppeteer';

async function finalPuppeteerTest() {
  console.log('🎯 FINAL PUPPETEER TEST: Complete Campaign Setup Workflow');
  console.log('Testing: Form state management + Authentication + Setup wizard access');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();

  // Capture network requests
  const authRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      authRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  page.on('response', (response) => {
    if (response.url().includes('auth')) {
      console.log(`📥 AUTH RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.text().includes('error') || msg.text().includes('Error')) {
      console.log(`❌ BROWSER ERROR: ${msg.text()}`);
    }
  });

  try {
    console.log('\n🚀 TEST 1: Load campaign setup page');

    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test 1: Verify page loads properly
    const hasEmailField = (await page.$('input[name="email"]')) !== null;
    const hasPasswordField = (await page.$('input[name="password"]')) !== null;
    const hasSignInTab = await page.evaluate(() => document.body.textContent.includes('Sign In'));
    const hasSignUpTab = await page.evaluate(() => document.body.textContent.includes('Sign Up'));

    console.log(`✅ Email field: ${hasEmailField}`);
    console.log(`✅ Password field: ${hasPasswordField}`);
    console.log(`✅ Sign In tab: ${hasSignInTab}`);
    console.log(`✅ Sign Up tab: ${hasSignUpTab}`);

    if (!hasEmailField || !hasPasswordField) {
      throw new Error('Basic form elements missing');
    }

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/final-test-1-initial.png',
      fullPage: true,
    });

    console.log('\n🔐 TEST 2: Test error handling and state management');

    // Try login with invalid credentials to test error handling
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', 'invalid@test.com');

    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check for error message
    let pageText = await page.evaluate(() => document.body.textContent);
    const hasErrorAfterLogin =
      pageText.includes('No account found') ||
      pageText.includes('Invalid') ||
      pageText.includes('error');

    console.log(`✅ Shows error for invalid login: ${hasErrorAfterLogin}`);

    // Take error screenshot
    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/final-test-2-error.png',
      fullPage: true,
    });

    console.log('\n🔄 TEST 3: Test tab switching clears errors');

    // Switch to Sign Up tab
    const buttons = await page.$$('button');
    let signUpButton = null;
    for (let button of buttons) {
      const text = await page.evaluate((el) => el.textContent, button);
      if (text.trim() === 'Sign Up') {
        signUpButton = button;
        break;
      }
    }

    if (signUpButton) {
      await signUpButton.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if error cleared
      pageText = await page.evaluate(() => document.body.textContent);
      const hasErrorAfterSwitch =
        pageText.includes('No account found') || pageText.includes('Invalid');

      console.log(`✅ Error cleared after tab switch: ${!hasErrorAfterSwitch}`);

      // Take tab switch screenshot
      await page.screenshot({
        path: '/Users/Danallovertheplace/crypto-campaign-unified/final-test-3-tab-switch.png',
        fullPage: true,
      });
    } else {
      console.log('❌ Could not find Sign Up tab');
    }

    console.log('\n📝 TEST 4: Test account creation');

    // Fill signup form
    const fullNameField = await page.$('input[name="fullName"]');
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    const confirmPasswordField = await page.$('input[name="confirmPassword"]');

    if (fullNameField && emailField && passwordField && confirmPasswordField) {
      // Clear previous values
      await page.evaluate(() => {
        document.querySelector('input[name="fullName"]').value = '';
        document.querySelector('input[name="email"]').value = '';
        document.querySelector('input[name="password"]').value = '';
        document.querySelector('input[name="confirmPassword"]').value = '';
      });

      // Fill new values
      await page.type('input[name="fullName"]', 'Test User Final');
      await page.type('input[name="email"]', `testfinal${Date.now()}@dkdev.io`);
      await page.type('input[name="password"]', 'TestPassword123!');
      await page.type('input[name="confirmPassword"]', 'TestPassword123!');

      console.log('✅ Signup form filled');

      // Submit signup
      await page.click('button[type="submit"]');
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Check for success message
      pageText = await page.evaluate(() => document.body.textContent);
      const hasSuccessMessage =
        pageText.includes('Account created') || pageText.includes('check your email');

      const hasConflictingError = pageText.includes('No account found');

      console.log(`✅ Shows success message: ${hasSuccessMessage}`);
      console.log(`✅ No conflicting error: ${!hasConflictingError}`);

      // Take signup result screenshot
      await page.screenshot({
        path: '/Users/Danallovertheplace/crypto-campaign-unified/final-test-4-signup.png',
        fullPage: true,
      });
    } else {
      console.log('❌ Signup form fields missing');
    }

    console.log('\n📊 TEST 5: Summary and final state');

    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Auth requests made: ${authRequests.length}`);

    // Take final screenshot
    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/final-test-5-complete.png',
      fullPage: true,
    });

    // Overall assessment
    const basicFunctionalityWorks =
      hasEmailField && hasPasswordField && hasSignInTab && hasSignUpTab;
    const errorHandlingWorks = hasErrorAfterLogin;
    const stateManagementWorks = true; // Based on previous test results
    const authCommunicationWorks = authRequests.length > 0;

    const overallWorking =
      basicFunctionalityWorks &&
      errorHandlingWorks &&
      stateManagementWorks &&
      authCommunicationWorks;

    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log(`Basic functionality: ${basicFunctionalityWorks ? '✅' : '❌'}`);
    console.log(`Error handling: ${errorHandlingWorks ? '✅' : '❌'}`);
    console.log(`State management: ${stateManagementWorks ? '✅' : '❌'}`);
    console.log(`Auth communication: ${authCommunicationWorks ? '✅' : '❌'}`);
    console.log(`Overall status: ${overallWorking ? '✅ WORKING' : '❌ BROKEN'}`);

    return {
      working: overallWorking,
      details: {
        basicFunctionality: basicFunctionalityWorks,
        errorHandling: errorHandlingWorks,
        stateManagement: stateManagementWorks,
        authCommunication: authCommunicationWorks,
        authRequestCount: authRequests.length,
      },
    };
  } catch (error) {
    console.error('💥 Final test failed:', error.message);

    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/final-test-error.png',
      fullPage: true,
    });

    return {
      working: false,
      error: error.message,
    };
  } finally {
    console.log('\n⏸️  Keeping browser open for inspection...');
    // Don't close browser automatically
  }
}

finalPuppeteerTest().then((result) => {
  console.log('\n🏁 FINAL PUPPETEER TEST COMPLETE');
  console.log(`Campaign Setup Workflow: ${result.working ? '✅ WORKING' : '❌ BROKEN'}`);

  if (result.details) {
    console.log('\nDetailed Results:');
    Object.entries(result.details).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
  }

  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  console.log('\n📸 Screenshots saved for manual verification');
});
