import puppeteer from 'puppeteer';

async function manualTest() {
  console.log('MANUAL VERIFICATION: Creating account and seeing where it breaks');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    devtools: true,
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`BROWSER: ${msg.text()}`);
  });

  try {
    console.log('\n1. Loading page...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('\n2. Clicking Sign Up...');
    await page.click('button:nth-child(2)'); // Second tab button should be Sign Up
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('\n3. Filling form...');
    await page.type('input[name="fullName"]', 'Manual Test User');
    await page.type('input[name="email"]', `manual${Date.now()}@dkdev.io`);
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('input[type="checkbox"]');

    console.log('\n4. Submitting...');
    await page.click('button[type="submit"]');

    console.log('\nWaiting 15 seconds for result...');
    await new Promise((resolve) => setTimeout(resolve, 15000));

    const url = page.url();
    const text = await page.evaluate(() => document.body.textContent);

    console.log(`Current URL: ${url}`);

    if (text.includes('Step 2')) {
      console.log('SUCCESS: Reached step 2 (Committee Search)');

      console.log('\n5. Testing committee skip...');
      const searchInput = await page.$('input[placeholder*="committee"]');
      if (searchInput) {
        await page.type('input[placeholder*="committee"]', 'test');

        // Look for skip button after search
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const skipButtons = await page.$$('button');
        for (let button of skipButtons) {
          const btnText = await page.evaluate((el) => el.textContent, button);
          if (btnText.includes('Continue Without')) {
            console.log('Found skip button, clicking...');
            await button.click();
            await new Promise((resolve) => setTimeout(resolve, 5000));

            const step3Text = await page.evaluate(() => document.body.textContent);
            if (step3Text.includes('Step 3') || step3Text.includes('Bank')) {
              console.log('SUCCESS: Reached step 3');

              // Look for bank skip button
              const bankSkipButtons = await page.$$('button');
              for (let btn of bankSkipButtons) {
                const bankText = await page.evaluate((el) => el.textContent, btn);
                if (bankText.includes('Skip Bank')) {
                  console.log('Found bank skip, clicking...');
                  await btn.click();
                  await new Promise((resolve) => setTimeout(resolve, 5000));

                  const step4Text = await page.evaluate(() => document.body.textContent);
                  if (step4Text.includes('Step 4') || step4Text.includes('Website')) {
                    console.log('SUCCESS: Reached step 4');
                    return 4;
                  } else {
                    console.log('STUCK: Cannot reach step 4 after bank skip');
                    return 3;
                  }
                }
              }
              console.log('ERROR: Bank skip button not found');
              return 3;
            } else {
              console.log('STUCK: Committee skip did not advance to step 3');
              return 2;
            }
          }
        }
        console.log('ERROR: Committee skip button not found');
        return 2;
      } else {
        console.log('ERROR: Committee search input not found');
        return 2;
      }
    } else if (text.includes('Campaign Setup')) {
      console.log('On some setup step but unclear which');
      return 1;
    } else {
      console.log('ERROR: Did not reach setup wizard');
      return 0;
    }
  } catch (error) {
    console.error('Manual test failed:', error.message);
    return 0;
  } finally {
    console.log('\nBrowser staying open for manual inspection...');
    // Don't close
  }
}

manualTest().then((step) => {
  console.log(`\nMANUAL TEST RESULT: Reached step ${step}/7`);

  if (step >= 4) {
    console.log('Campaign setup workflow is progressing well');
  } else if (step >= 2) {
    console.log('Campaign setup workflow partially working but has progression issues');
  } else {
    console.log('Campaign setup workflow is broken');
  }
});
