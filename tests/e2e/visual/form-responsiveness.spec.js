import { test, expect } from '@playwright/test';
import { viewports, waitForStableState } from '../fixtures/test-data.js';

test.describe('Form Responsiveness Visual Tests', () => {
  const breakpoints = [
    { name: 'mobile-small', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 667 },
    { name: 'mobile-large', width: 414, height: 896 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'desktop-small', width: 1024, height: 800 },
    { name: 'desktop', width: 1280, height: 1024 },
    { name: 'desktop-large', width: 1440, height: 900 },
    { name: 'wide-screen', width: 1920, height: 1080 },
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForStableState(page);
  });

  // Test contribution form across all breakpoints
  test('contribution form responsiveness across breakpoints', async ({ page }) => {
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.reload();
      await waitForStableState(page);

      // Wait for form elements to be visible
      await page.waitForSelector('form, [data-testid="donor-form"], .contribution-form', {
        timeout: 10000,
      });

      await expect(page).toHaveScreenshot(`contribution-form-${breakpoint.name}.png`, {
        fullPage: true,
      });
    }
  });

  test('form field layout and spacing on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForStableState(page);

    // Fill form to test field spacing
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
      await amountInput.fill('250');
    }

    await expect(page).toHaveScreenshot('form-fields-mobile-spacing.png', {
      fullPage: true,
    });
  });

  test('button responsiveness and touch targets', async ({ page }) => {
    const mobileViewports = [
      { name: 'iphone-se', width: 375, height: 667 },
      { name: 'iphone-12', width: 390, height: 844 },
      { name: 'android-small', width: 360, height: 640 },
    ];

    for (const viewport of mobileViewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      await waitForStableState(page);

      // Focus on buttons to test touch target sizes
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        // Test primary button
        const primaryButton = buttons.first();
        if (await primaryButton.isVisible()) {
          await primaryButton.focus();
          await expect(page).toHaveScreenshot(`buttons-${viewport.name}-focused.png`);
        }
      }
    }
  });

  test('form validation messages on different screens', async ({ page }) => {
    const testViewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 1024 },
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      await waitForStableState(page);

      // Trigger validation by submitting empty form
      const submitButton = page
        .locator('button[type="submit"], .submit-btn, [data-testid="submit-button"]')
        .first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1500); // Wait for validation messages

        await expect(page).toHaveScreenshot(`validation-messages-${viewport.name}.png`, {
          fullPage: true,
        });
      }
    }
  });

  test('horizontal scrolling prevention on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Very narrow viewport
    await page.reload();
    await waitForStableState(page);

    // Check if page content fits without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // Take screenshot to verify no horizontal overflow
    await expect(page).toHaveScreenshot('no-horizontal-scroll-mobile.png', {
      fullPage: true,
    });

    // Verify no horizontal scrollbar
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });

  test('form orientation changes', async ({ page }) => {
    // Test portrait to landscape transitions
    const orientations = [
      { name: 'portrait', width: 375, height: 812 },
      { name: 'landscape', width: 812, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
    ];

    for (const orientation of orientations) {
      await page.setViewportSize(orientation);
      await page.reload();
      await waitForStableState(page);

      await expect(page).toHaveScreenshot(`form-orientation-${orientation.name}.png`, {
        fullPage: true,
      });
    }
  });

  test('input focus states on different devices', async ({ page }) => {
    const devices = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 1024 },
    ];

    for (const device of devices) {
      await page.setViewportSize(device);
      await page.reload();
      await waitForStableState(page);

      // Test input focus states
      const inputs = page.locator(
        'input[type="text"], input[type="email"], input[type="number"], textarea'
      );
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        await inputs.first().focus();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot(`input-focus-${device.name}.png`, {
          fullPage: true,
        });
      }
    }
  });

  test('form overflow and scrolling behavior', async ({ page }) => {
    // Test very small viewport to check scrolling
    await page.setViewportSize({ width: 320, height: 400 }); // Very short height
    await page.reload();
    await waitForStableState(page);

    await expect(page).toHaveScreenshot('form-overflow-small-viewport.png', {
      fullPage: true,
    });

    // Test scroll behavior with content
    const messageField = page.locator('textarea').first();
    if (await messageField.isVisible()) {
      await messageField.fill(
        'This is a very long message that should test the form scrolling behavior and how it handles overflow content in a small viewport. The form should remain usable and accessible even with limited screen real estate.'
      );

      await expect(page).toHaveScreenshot('form-overflow-with-content.png', {
        fullPage: true,
      });
    }
  });

  test('responsive typography and readability', async ({ page }) => {
    const textSizeViewports = [
      { name: 'small-text', width: 320, height: 568 },
      { name: 'medium-text', width: 768, height: 1024 },
      { name: 'large-text', width: 1440, height: 900 },
    ];

    for (const viewport of textSizeViewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      await waitForStableState(page);

      // Fill form to show all text content
      const nameInput = page.locator('input[name="name"], input[name="donorName"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Typography Test User');
      }

      await expect(page).toHaveScreenshot(`typography-${viewport.name}.png`, {
        fullPage: true,
      });
    }
  });

  test('form grid and layout adaptation', async ({ page }) => {
    // Test how form fields reflow at different breakpoints
    const layoutBreakpoints = [
      { name: 'stack-mobile', width: 320, height: 568 },
      { name: 'two-column-tablet', width: 768, height: 1024 },
      { name: 'multi-column-desktop', width: 1200, height: 800 },
    ];

    for (const breakpoint of layoutBreakpoints) {
      await page.setViewportSize(breakpoint);
      await page.reload();
      await waitForStableState(page);

      // Fill multiple fields to show layout
      const inputs = page.locator('input[type="text"], input[type="email"], input[type="number"]');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 4); i++) {
        await inputs.nth(i).fill(`Field ${i + 1} Content`);
      }

      await expect(page).toHaveScreenshot(`form-layout-${breakpoint.name}.png`, {
        fullPage: true,
      });
    }
  });

  test('accessibility zoom levels', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });

    // Test different zoom levels (simulated by changing viewport)
    const zoomLevels = [
      { name: '150-percent', width: 853, height: 683 }, // 1280/1.5, 1024/1.5
      { name: '200-percent', width: 640, height: 512 }, // 1280/2, 1024/2
      { name: '300-percent', width: 427, height: 341 }, // 1280/3, 1024/3
    ];

    for (const zoom of zoomLevels) {
      await page.setViewportSize(zoom);
      await page.reload();
      await waitForStableState(page);

      await expect(page).toHaveScreenshot(`accessibility-zoom-${zoom.name}.png`, {
        fullPage: true,
      });
    }
  });
});
