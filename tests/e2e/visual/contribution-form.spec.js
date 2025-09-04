import { test, expect } from '@playwright/test';

test.describe('Contribution Form Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the contribution form page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for React components to render
    await page.waitForSelector('[data-testid="donor-form"], .donor-form, form', { timeout: 10000 });
  });

  test('contribution form initial state', async ({ page }) => {
    // Take screenshot of the initial form state
    await expect(page).toHaveScreenshot('contribution-form-initial.png', {
      fullPage: true,
    });
  });

  test('contribution form with validation errors', async ({ page }) => {
    // Try to submit empty form to trigger validation
    const submitButton = page
      .locator('button[type="submit"], .submit-btn, [data-testid="submit-button"]')
      .first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000); // Wait for validation to appear
    }

    await expect(page).toHaveScreenshot('contribution-form-validation-errors.png', {
      fullPage: true,
    });
  });

  test('contribution form filled state', async ({ page }) => {
    // Fill out the form with test data
    const nameInput = page
      .locator('input[name="name"], input[name="donorName"], [data-testid="name-input"]')
      .first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('John Doe');
    }

    const emailInput = page
      .locator('input[name="email"], input[type="email"], [data-testid="email-input"]')
      .first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('john.doe@example.com');
    }

    const amountInput = page
      .locator('input[name="amount"], input[type="number"], [data-testid="amount-input"]')
      .first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('100');
    }

    const messageInput = page
      .locator('textarea[name="message"], textarea, [data-testid="message-input"]')
      .first();
    if (await messageInput.isVisible()) {
      await messageInput.fill('Supporting this great cause!');
    }

    await expect(page).toHaveScreenshot('contribution-form-filled.png', {
      fullPage: true,
    });
  });

  test('contribution form mobile view', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('contribution-form-mobile.png', {
      fullPage: true,
    });
  });

  test('contribution form with Web3 wallet connection', async ({ page }) => {
    // Look for wallet connection button
    const walletButton = page
      .locator('button')
      .filter({ hasText: /connect|wallet/i })
      .first();
    if (await walletButton.isVisible()) {
      await walletButton.click();
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('contribution-form-wallet-connect.png', {
        fullPage: true,
      });
    }
  });

  test('contribution form payment methods', async ({ page }) => {
    // Look for different payment method options
    const paymentMethods = page.locator(
      '[data-testid*="payment"], .payment-method, input[type="radio"]'
    );
    const count = await paymentMethods.count();

    if (count > 0) {
      // Click through different payment methods
      for (let i = 0; i < count && i < 3; i++) {
        await paymentMethods.nth(i).click();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot(`contribution-form-payment-method-${i}.png`, {
          fullPage: true,
        });
      }
    }
  });

  test('contribution form accessibility features', async ({ page }) => {
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('contribution-form-dark-mode.png', {
      fullPage: true,
    });

    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('contribution-form-reduced-motion.png', {
      fullPage: true,
    });
  });

  test('contribution form hover states', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], .submit-btn').first();
    if (await submitButton.isVisible()) {
      await submitButton.hover();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('contribution-form-button-hover.png', {
        fullPage: true,
      });
    }
  });
});
