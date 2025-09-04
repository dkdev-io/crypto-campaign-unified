import puppeteer from 'puppeteer';

async function finalVerificationTest() {
  console.log('FINAL VERIFICATION TEST: Complete workflow');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  try {
    console.log('1. Load /campaigns/auth/setup');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('2. Switch to Sign Up');
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate((el) => el.textContent, button);
      if (text.trim() === 'Sign Up') {
        await button.click();
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('3. Fill signup form');
    const uniqueEmail = `test${Date.now()}@dkdev.io`;
    await page.type('input[name="fullName"]', 'Final Test User');
    await page.type('input[name="email"]', uniqueEmail);
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('input[name="agreeToTerms"]');

    console.log('4. Submit signup');
    await page.click('button[type="submit"]');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log('5. Check result');
    const currentUrl = page.url();
    const pageText = await page.evaluate(() => document.body.textContent);

    const reachedSetupWizard =
      currentUrl.includes('/campaigns/auth/setup') &&
      (pageText.includes('Campaign Setup') ||
        pageText.includes('Step 2') ||
        pageText.includes('Committee'));

    console.log(`Current URL: ${currentUrl}`);
    console.log(`Reached setup wizard: ${reachedSetupWizard}`);

    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/final-verification.png',
      fullPage: true,
    });

    return reachedSetupWizard;
  } catch (error) {
    console.error('Test failed:', error.message);

    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/final-verification-error.png',
      fullPage: true,
    });

    return false;
  } finally {
    await browser.close();
  }
}

finalVerificationTest().then((success) => {
  console.log(`Final verification: ${success ? 'WORKING' : 'BROKEN'}`);
  process.exit(success ? 0 : 1);
});
