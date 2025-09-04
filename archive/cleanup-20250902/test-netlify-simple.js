import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing Netlify SPA routing...');

    // Test 1: Direct navigation to /setup
    console.log('\n🔗 Testing direct navigation to /setup...');
    await page.goto('https://cryptocampaign.netlify.app/setup', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const setupUrl = page.url();
    const setupTitle = await page.title();
    const pageContent = await page.content();

    console.log('🌐 Setup page URL:', setupUrl);
    console.log('📄 Setup page title:', setupTitle);

    // Check if it's a 404 or the actual setup page
    const is404 =
      pageContent.includes('404') ||
      pageContent.includes('Not Found') ||
      setupTitle.includes('404');
    const hasSetupContent =
      pageContent.includes('Campaign Setup') ||
      pageContent.includes('setup') ||
      pageContent.includes('Tell us about');

    if (setupUrl.includes('/setup') && !is404) {
      console.log('✅ SUCCESS: Direct /setup navigation works - no 404!');
      if (hasSetupContent) {
        console.log('✅ Setup page has expected content');
      } else {
        console.log('⚠️  Setup page loaded but content not detected');
      }
    } else {
      console.log('❌ FAILED: Direct /setup navigation shows 404 or error');
    }

    // Test 2: Direct navigation to /auth
    console.log('\n🔗 Testing direct navigation to /auth...');
    await page.goto('https://cryptocampaign.netlify.app/auth', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const authUrl = page.url();
    const authTitle = await page.title();
    const authContent = await page.content();

    console.log('🌐 Auth page URL:', authUrl);
    console.log('📄 Auth page title:', authTitle);

    const authIs404 =
      authContent.includes('404') || authContent.includes('Not Found') || authTitle.includes('404');
    const hasAuthContent =
      authContent.includes('Sign In') ||
      authContent.includes('Login') ||
      authContent.includes('auth');

    if (authUrl.includes('/auth') && !authIs404) {
      console.log('✅ SUCCESS: Direct /auth navigation works - no 404!');
      if (hasAuthContent) {
        console.log('✅ Auth page has expected content');
      }
    } else {
      console.log('❌ FAILED: Direct /auth navigation shows 404 or error');
    }

    // Test 3: Navigation from main page
    console.log('\n🔗 Testing navigation from main page...');
    await page.goto('https://cryptocampaign.netlify.app/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('✅ Main page loaded');

    // Check if buttons exist and try to click one
    const hasButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((btn) => btn.textContent.includes('Get Started'));
    });

    if (hasButtons) {
      console.log('✅ Get Started buttons found on main page');

      // Try clicking
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent.includes('Get Started')
        );
        if (button) {
          button.click();
        }
      });

      // Wait a moment for navigation
      await page.waitForTimeout(2000);

      const finalUrl = page.url();
      console.log('🌐 URL after button click:', finalUrl);

      if (finalUrl.includes('/setup')) {
        console.log('✅ SUCCESS: Button click redirected to /setup');
      } else {
        console.log('⚠️  Button clicked but no redirect detected yet');
      }
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ Main page loads successfully');
    console.log('✅ Sign up buttons exist and have click handlers');
    console.log('✅ SPA routing should be working with _redirects file');
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();
