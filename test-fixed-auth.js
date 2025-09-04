import puppeteer from 'puppeteer';

async function testFixedAuth() {
  console.log('🚀 Testing /donors/auth after fixes...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
  });

  try {
    const page = await browser.newPage();

    // Enable console logging to see our debug messages
    page.on('console', (msg) => {
      console.log('🌐 Browser:', msg.text());
    });

    console.log('1. Navigating to /donors/auth...');
    await page.goto('http://localhost:5173/donors/auth', {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    // Wait for any redirects to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);

    // Take screenshot
    await page.screenshot({ path: 'fixed-auth-test.png', fullPage: true });
    console.log('📷 Screenshot saved: fixed-auth-test.png');

    if (finalUrl.includes('/donors/auth')) {
      // Check for login form elements
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const signInButton = await page.$('button:contains("Sign In")');

      if (emailInput && passwordInput && signInButton) {
        console.log('✅ SUCCESS: Login form is accessible');

        // Try the login
        console.log('\n2. Attempting login...');

        await page.type('input[type="email"]', 'test@dkdev.io');
        await page.type('input[type="password"]', 'TestDonor123!');

        // Click submit
        await signInButton.click();

        // Wait for response
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const loginUrl = page.url();
        console.log('📍 After login URL:', loginUrl);

        // Take screenshot after login
        await page.screenshot({ path: 'after-login-attempt.png', fullPage: true });
        console.log('📷 Screenshot saved: after-login-attempt.png');

        if (loginUrl.includes('/donors/dashboard')) {
          return { success: true, reason: 'Login successful - redirected to dashboard' };
        } else if (loginUrl.includes('/donors/auth')) {
          return { success: false, reason: 'Login failed - still on auth page' };
        } else {
          return { success: true, reason: `Login successful - redirected to ${loginUrl}` };
        }
      } else {
        return { success: false, reason: 'Auth page loaded but no login form found' };
      }
    } else {
      return { success: false, reason: `Still redirecting to: ${finalUrl}` };
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, reason: `Test error: ${error.message}` };
  } finally {
    console.log('\nBrowser will close in 5 seconds...');
    setTimeout(() => browser.close(), 5000);
  }
}

testFixedAuth()
  .then((result) => {
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log('🎉 LOGIN TEST RESULT: SUCCESS');
      console.log(`   ${result.reason}`);
    } else {
      console.log('💥 LOGIN TEST RESULT: FAILED');
      console.log(`   ${result.reason}`);
    }
    console.log('='.repeat(60));
  })
  .catch(console.error);
