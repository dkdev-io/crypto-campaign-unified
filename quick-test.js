import puppeteer from 'puppeteer';

async function quickTest() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/current-state.png',
      fullPage: true,
    });

    const hasSignUp = await page.evaluate(() => document.body.textContent.includes('Sign Up'));
    const hasEmailField = (await page.$('input[name="email"]')) !== null;
    const hasFullNameField = (await page.$('input[name="fullName"]')) !== null;

    console.log(`Has Sign Up: ${hasSignUp}`);
    console.log(`Has email field: ${hasEmailField}`);
    console.log(`Has fullName field: ${hasFullNameField}`);
    console.log(`Current URL: ${page.url()}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest();
