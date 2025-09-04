import puppeteer from 'puppeteer';

async function finalVerification() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
  });

  const page = await browser.newPage();

  try {
    console.log('🎯 FINAL VERIFICATION - Checking setup wizard...');

    await page.goto('http://localhost:5173/campaigns/auth/setup?bypass=dev', {
      waitUntil: 'networkidle0',
    });

    // Take a screenshot
    await page.screenshot({
      path: '/private/tmp/final-verification-step1.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved: /private/tmp/final-verification-step1.png');

    // Get current state
    const currentState = await page.evaluate(() => {
      const setupContainer = document.querySelector('.setup-container');
      const body = document.body;

      return {
        currentStep: document.querySelector('.step-indicator')?.textContent?.trim(),
        h2Text: document.querySelector('h2')?.textContent?.trim(),
        setupContainerBg: setupContainer
          ? window.getComputedStyle(setupContainer).backgroundColor
          : 'none',
        bodyBg: window.getComputedStyle(body).backgroundColor,
        hasEmojis: /[🔍📝🏦🎨]/.test(document.body.textContent),
        url: window.location.href,
      };
    });

    console.log('\n📋 CURRENT STATE:');
    console.log(`Step: ${currentState.currentStep}`);
    console.log(`H2: ${currentState.h2Text}`);
    console.log(`Setup container bg: ${currentState.setupContainerBg}`);
    console.log(`Body bg: ${currentState.bodyBg}`);
    console.log(`Has emojis: ${currentState.hasEmojis}`);
    console.log(`URL: ${currentState.url}`);

    // Try to advance to step 2 by filling the form
    try {
      const campaignInput = await page.waitForSelector(
        'input[name="campaignName"], [placeholder*="campaign"]',
        { timeout: 3000 }
      );
      await campaignInput.type('Test Campaign');

      const websiteInput = await page.waitForSelector('input[name="website"], [type="url"]', {
        timeout: 3000,
      });
      await websiteInput.type('https://example.com');

      const nextBtn = await page.waitForSelector('button:has-text("Next"), .btn-primary', {
        timeout: 3000,
      });
      await nextBtn.click();

      await page.waitForTimeout(2000);

      // Get step 2 state
      const step2State = await page.evaluate(() => {
        return {
          currentStep: document.querySelector('.step-indicator')?.textContent?.trim(),
          h2Text: document.querySelector('h2')?.textContent?.trim(),
          hasTargetEmojis: /🔍.*Find.*Committee|📝.*Add.*Committee/.test(document.body.textContent),
          allEmojis: document.body.textContent.match(/[🔍📝🏦🎨]/g) || [],
          url: window.location.href,
        };
      });

      console.log('\n📋 STEP 2 STATE:');
      console.log(`Step: ${step2State.currentStep}`);
      console.log(`H2: ${step2State.h2Text}`);
      console.log(`Has target emojis: ${step2State.hasTargetEmojis}`);
      console.log(`All emojis found: ${step2State.allEmojis}`);

      await page.screenshot({
        path: '/private/tmp/final-verification-step2.png',
        fullPage: true,
      });
      console.log('📸 Step 2 screenshot: /private/tmp/final-verification-step2.png');
    } catch (e) {
      console.log('Could not advance to step 2:', e.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
  } finally {
    await browser.close();
  }
}

finalVerification().catch(console.error);
