#!/usr/bin/env node

/**
 * Puppeteer Browser Test - Campaign Signup Verification
 * Tests signup flow with dan@dkdev.io and password 32test1!
 */

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'dan@dkdev.io';
const TEST_PASSWORD = '32test1!';
const TEST_FULL_NAME = 'Dan Test User';

async function testSignupWithPuppeteer() {
  console.log('🚀 Starting Puppeteer browser test...');
  console.log('📧 Test Email:', TEST_EMAIL);
  console.log('🔒 Test Password:', TEST_PASSWORD);
  console.log('👤 Test Name:', TEST_FULL_NAME);

  let browser;

  try {
    // Launch browser
    console.log('\n1. 🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show browser for verification
      slowMo: 500, // Slow down for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to campaign auth page
    console.log('2. 📍 Navigating to campaign auth page...');
    await page.goto('http://localhost:5175/campaigns/auth', {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    console.log('✅ Page loaded successfully');

    // Wait for and click the Sign Up tab
    console.log('3. 📝 Switching to Sign Up tab...');
    await page.waitForSelector('button', { timeout: 5000 });

    // Find the Sign Up button by text content
    const signUpButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((button) => button.textContent.includes('Sign Up'));
    });

    if (signUpButton.asElement()) {
      await signUpButton.asElement().click();
      console.log('✅ Clicked Sign Up tab');
    } else {
      console.log('⚠️  Sign Up button not found, checking if already on signup');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fill in the signup form
    console.log('4. ✍️  Filling signup form...');

    // Full Name
    await page.waitForSelector('#signup-fullname', { timeout: 5000 });
    await page.click('#signup-fullname', { clickCount: 3 });
    await page.type('#signup-fullname', TEST_FULL_NAME);

    // Email
    await page.click('#signup-email', { clickCount: 3 });
    await page.type('#signup-email', TEST_EMAIL);

    // Password
    await page.click('#signup-password', { clickCount: 3 });
    await page.type('#signup-password', TEST_PASSWORD);

    // Confirm Password
    await page.click('#signup-confirmpassword', { clickCount: 3 });
    await page.type('#signup-confirmpassword', TEST_PASSWORD);

    // Agree to terms
    await page.click('input[name="agreeToTerms"]');

    console.log('✅ Form filled with test credentials');

    // Listen for console messages from the page
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        console.log('🔍 Browser Console:', msg.text());
      }
    });

    // Submit the form
    console.log('5. 🚀 Submitting signup form...');
    await page.click('button[type="submit"]');

    // Wait for response and check for success/error messages
    console.log('6. ⏳ Waiting for signup response...');

    try {
      // Wait for either success message or error message
      await page.waitForSelector('.success, .error, .info', {
        timeout: 10000,
        visible: true,
      });

      // Check for success indicators
      const successElements = await page.$$('.success');
      const errorElements = await page.$$('.error');
      const infoElements = await page.$$('.info');

      if (successElements.length > 0) {
        console.log('✅ SUCCESS: Signup completed successfully!');
        const successText = await successElements[0].textContent();
        console.log('   Success message:', successText);
      }

      if (errorElements.length > 0) {
        console.log('⚠️  Error message detected:');
        const errorText = await errorElements[0].textContent();
        console.log('   Error:', errorText);
      }

      if (infoElements.length > 0) {
        console.log('ℹ️  Info message:');
        const infoText = await infoElements[0].textContent();
        console.log('   Info:', infoText);
      }
    } catch (timeoutError) {
      console.log('⏰ Timeout waiting for response, checking page content...');

      // Check if there's any indication of success or failure
      const pageContent = await page.content();

      if (pageContent.includes('verification email') || pageContent.includes('check your email')) {
        console.log('✅ SUCCESS: Email verification message found in page');
      } else if (pageContent.includes('error') || pageContent.includes('failed')) {
        console.log('❌ ERROR: Error message found in page');
      } else {
        console.log('❓ UNCLEAR: No clear success/error message found');
      }
    }

    // Take screenshot for verification
    console.log('7. 📸 Taking screenshot...');
    await page.screenshot({
      path: 'puppeteer-signup-test-result.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved as puppeteer-signup-test-result.png');

    // Keep browser open for manual inspection
    console.log('8. 🔍 Browser will remain open for 10 seconds for manual inspection...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error('❌ PUPPETEER TEST FAILED:', error.message);
    console.error('Full error:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔚 Browser closed');
    }
  }
}

// Start the test
console.log('🎬 PUPPETEER SIGNUP TEST STARTING...\n');
testSignupWithPuppeteer()
  .then(() => {
    console.log('\n🎉 PUPPETEER TEST COMPLETED');
  })
  .catch((error) => {
    console.error('\n💥 PUPPETEER TEST ERROR:', error);
  });
