import { test, expect } from '@playwright/test';

test.describe('Live Campaign Site Monitoring', () => {
  const LIVE_SITE_URL = 'https://testy-pink-chancellor.lovable.app/';

  test('live site accessibility and form loading check', async ({ page }) => {
    // Navigate to the live site
    await page.goto(LIVE_SITE_URL);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra wait for any dynamic content

    // Take a screenshot of the current live site
    await expect(page).toHaveScreenshot('live-site-current-state.png', {
      fullPage: true,
    });

    // Check if the page loaded successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).not.toBe('Error');


    // Check for main content containers
    const mainContent = page.locator('main, #root, .app, body > div').first();
    await expect(mainContent).toBeVisible();

    // Look for form elements
    const forms = page.locator('form');
    const formCount = await forms.count();

    // Look for input fields (donation/contribution forms)
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="number"], input[name*="amount"], input[name*="name"]');
    const inputCount = await inputs.count();

    // Look for buttons (submit, connect wallet, etc.)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Check for specific campaign elements
    const campaignElements = page.locator('[data-testid*="campaign"], .campaign, [class*="campaign"], [id*="campaign"]');
    const campaignCount = await campaignElements.count();

    // Verify no obvious error states
    const errorElements = page.locator('.error, .alert-error, [data-testid*="error"]');
    const errorCount = await errorElements.count();
    console.log(`Found ${errorCount} error elements on the live site`);

    // Check for loading states (shouldn't be present after page load)
    const loadingElements = page.locator('.loading, .spinner, [data-testid*="loading"]');
    const loadingCount = await loadingElements.count();

    // Generate a basic health report
    const healthReport = {
      timestamp: new Date().toISOString(),
      url: LIVE_SITE_URL,
      title: title,
      formsFound: formCount,
      inputsFound: inputCount,
      buttonsFound: buttonCount,
      campaignElementsFound: campaignCount,
      errorsFound: errorCount,
      loadingElementsFound: loadingCount,
      isAccessible: formCount > 0 || inputCount > 0 || buttonCount > 0,
      status: errorCount === 0 && (formCount > 0 || inputCount > 0) ? 'HEALTHY' : 'NEEDS_ATTENTION'
    };

  });

  test('live site form functionality test', async ({ page }) => {
    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to interact with form elements if present
    const nameInput = page.locator('input[name="name"], input[name="donorName"], input[placeholder*="name" i]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
    const amountInput = page.locator('input[name="amount"], input[type="number"], input[placeholder*="amount" i]').first();

    let interactionResults = {
      canFillName: false,
      canFillEmail: false,
      canFillAmount: false,
      hasSubmitButton: false
    };

    // Test name input
    if (await nameInput.isVisible()) {
      try {
        await nameInput.fill('Test User');
        await expect(nameInput).toHaveValue('Test User');
        interactionResults.canFillName = true;
      } catch (error) {
        console.log('Could not fill name input:', error.message);
      }
    }

    // Test email input
    if (await emailInput.isVisible()) {
      try {
        await emailInput.fill('test@dkdev.io');
        await expect(emailInput).toHaveValue('test@dkdev.io');
        interactionResults.canFillEmail = true;
      } catch (error) {
        console.log('Could not fill email input:', error.message);
      }
    }

    // Test amount input
    if (await amountInput.isVisible()) {
      try {
        await amountInput.fill('25');
        await expect(amountInput).toHaveValue('25');
        interactionResults.canFillAmount = true;
      } catch (error) {
        console.log('Could not fill amount input:', error.message);
      }
    }

    // Check for submit button
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /submit|donate|contribute|send/i }).first();
    interactionResults.hasSubmitButton = await submitButton.isVisible();

    // Take screenshot of form with filled data
    if (interactionResults.canFillName || interactionResults.canFillEmail || interactionResults.canFillAmount) {
      await expect(page).toHaveScreenshot('live-site-form-filled.png', {
        fullPage: true,
      });
    }

    console.log('Form Interaction Results:', JSON.stringify(interactionResults, null, 2));

    // Overall form health assessment
    const formIsHealthy = (interactionResults.canFillName || interactionResults.canFillEmail || interactionResults.canFillAmount) && interactionResults.hasSubmitButton;
  });

  test('live site mobile responsiveness check', async ({ page }) => {
    await page.goto(LIVE_SITE_URL);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('live-site-mobile-view.png', {
      fullPage: true,
    });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('live-site-tablet-view.png', {
      fullPage: true,
    });

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('live-site-desktop-view.png', {
      fullPage: true,
    });
  });

  test('live site performance and loading speed', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;

    // Performance should be under 5 seconds for a good user experience
    expect(loadTime).toBeLessThan(5000);

    // Check for any console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(3000);

    if (logs.length > 0) {
      console.log('Console errors found:', logs);
    }

    console.log(`Performance Report - Load Time: ${loadTime}ms, Console Errors: ${logs.length}`);
  });

  test('live site wallet integration check', async ({ page }) => {
    await page.goto(LIVE_SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for wallet connection elements
    const walletButtons = page.locator('button').filter({ hasText: /connect.*wallet|wallet.*connect|metamask/i });
    const walletCount = await walletButtons.count();


    if (walletCount > 0) {
      // Take screenshot of wallet integration
      await expect(page).toHaveScreenshot('live-site-wallet-integration.png', {
        fullPage: true,
      });

      // Try to hover over wallet button to see interaction
      await walletButtons.first().hover();
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('live-site-wallet-hover.png', {
        fullPage: true,
      });
    }

    // Look for Web3 indicators
    const web3Elements = page.locator('[data-testid*="web3"], .web3, [class*="web3"]');
    const web3Count = await web3Elements.count();
  });
});