import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 Testing http://localhost:5173/campaigns/auth/setup');
  await page.goto('http://localhost:5173/campaigns/auth/setup');
  await page.waitForSelector('body', { timeout: 10000 });

  // Click DEV BYPASS if present
  try {
    await page.waitForSelector('button', { timeout: 3000 });
    const bypassClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent.includes('DEV BYPASS') || btn.textContent.includes('Setup')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (bypassClicked) {
      console.log('🔑 DEV BYPASS clicked');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  } catch (e) {}

  await page.screenshot({ path: 'committee-5173-final.png', fullPage: true });

  // Check for committee form
  const hasCommitteeForm = await page.$('input[placeholder="Enter your committee name"]');
  console.log(hasCommitteeForm ? '✅ Committee form found' : '❌ No committee form');

  if (hasCommitteeForm) {
    await page.type('input[placeholder="Enter your committee name"]', 'Test Committee 5173');
    await page.type('input[placeholder="Committee address"]', '123 Test St');
    await page.type('input[placeholder="City"]', 'TestCity');
    await page.type('input[placeholder="State"]', 'TX');
    await page.type('input[placeholder="ZIP"]', '12345');

    // Submit
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent.includes('Save Committee')) {
          btn.click();
          break;
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log('🎉 Form submitted - check browser for results');
  }

  // Don't close browser
})();
