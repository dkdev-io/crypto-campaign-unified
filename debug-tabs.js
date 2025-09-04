import puppeteer from 'puppeteer';

async function debugTabs() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/Danallovertheplace/crypto-campaign-unified/debug-initial.png',
    });

    console.log('Looking for Sign Up tab...');

    // Find all buttons and log their text
    const buttons = await page.$$('button');
    for (let i = 0; i < buttons.length; i++) {
      const text = await page.evaluate((el) => el.textContent, buttons[i]);
      console.log(`Button ${i}: "${text.trim()}"`);

      if (text.trim() === 'Sign Up') {
        console.log(`Clicking Sign Up button ${i}...`);
        await buttons[i].click();
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if form changed
        const hasFullName = (await page.$('input[name="fullName"]')) !== null;
        console.log(`Full name field visible after click: ${hasFullName}`);

        await page.screenshot({
          path: '/Users/Danallovertheplace/crypto-campaign-unified/debug-after-click.png',
        });

        if (hasFullName) {
          console.log('SUCCESS: Sign Up tab working');
          return true;
        } else {
          console.log('FAILED: Sign Up tab not working');
          return false;
        }
      }
    }

    console.log('ERROR: Sign Up button not found');
    return false;
  } catch (error) {
    console.error('Debug failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

debugTabs().then((result) => {
  console.log(`Tab switching: ${result ? 'WORKING' : 'BROKEN'}`);
});
