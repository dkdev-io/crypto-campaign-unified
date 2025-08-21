import { test, expect } from '@playwright/test';

test.describe('Campaign Setup Form Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to campaign setup
    await page.goto('/');
    
    // Look for setup wizard or admin interface
    const setupButton = page.locator('button, a').filter({ hasText: /setup|admin|create|campaign/i }).first();
    if (await setupButton.isVisible()) {
      await setupButton.click();
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('campaign setup wizard initial step', async ({ page }) => {
    await expect(page).toHaveScreenshot('campaign-setup-step1.png', {
      fullPage: true,
    });
  });

  test('campaign info form', async ({ page }) => {
    // Fill campaign information
    const titleInput = page.locator('input[name*="title"], input[name*="name"], [data-testid*="title"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Save the Ocean Campaign');
    }

    const descriptionInput = page.locator('textarea[name*="description"], textarea, [data-testid*="description"]').first();
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('A campaign dedicated to ocean conservation and marine life protection.');
    }

    const goalInput = page.locator('input[name*="goal"], input[name*="target"], [data-testid*="goal"]').first();
    if (await goalInput.isVisible()) {
      await goalInput.fill('50000');
    }

    await expect(page).toHaveScreenshot('campaign-setup-info-filled.png', {
      fullPage: true,
    });
  });

  test('compliance and legal settings', async ({ page }) => {
    // Navigate to compliance step
    const nextButton = page.locator('button').filter({ hasText: /next|continue/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Look for compliance checkboxes
    const complianceCheckboxes = page.locator('input[type="checkbox"]');
    const count = await complianceCheckboxes.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      await complianceCheckboxes.nth(i).check();
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveScreenshot('campaign-setup-compliance.png', {
      fullPage: true,
    });
  });

  test('form customization options', async ({ page }) => {
    // Look for customization panel
    const customizationTab = page.locator('button, a').filter({ hasText: /custom|design|theme/i }).first();
    if (await customizationTab.isVisible()) {
      await customizationTab.click();
      await page.waitForTimeout(1000);
    }

    // Try different color options if available
    const colorOptions = page.locator('[data-testid*="color"], .color-picker, input[type="color"]');
    if (await colorOptions.first().isVisible()) {
      await colorOptions.first().click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot('campaign-setup-customization.png', {
      fullPage: true,
    });
  });

  test('embed options configuration', async ({ page }) => {
    // Navigate to embed options
    const embedTab = page.locator('button, a').filter({ hasText: /embed|share|widget/i }).first();
    if (await embedTab.isVisible()) {
      await embedTab.click();
      await page.waitForTimeout(1000);
    }

    // Toggle embed options
    const embedCheckboxes = page.locator('input[type="checkbox"]');
    const count = await embedCheckboxes.count();
    
    for (let i = 0; i < Math.min(count, 2); i++) {
      await embedCheckboxes.nth(i).check();
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveScreenshot('campaign-setup-embed-options.png', {
      fullPage: true,
    });
  });

  test('launch confirmation screen', async ({ page }) => {
    // Navigate through wizard to final step
    const buttons = page.locator('button').filter({ hasText: /next|continue|finish|launch/i });
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 4); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1000);
      }
    }

    await expect(page).toHaveScreenshot('campaign-setup-launch-confirmation.png', {
      fullPage: true,
    });
  });

  test('setup wizard step indicator', async ({ page }) => {
    // Focus on the step indicator/progress bar
    const stepIndicator = page.locator('[data-testid*="step"], .step-indicator, .progress-bar').first();
    if (await stepIndicator.isVisible()) {
      await expect(stepIndicator).toHaveScreenshot('campaign-setup-step-indicator.png');
    }
  });

  test('campaign setup mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('campaign-setup-mobile.png', {
      fullPage: true,
    });
  });

  test('campaign setup tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('campaign-setup-tablet.png', {
      fullPage: true,
    });
  });

  test('campaign setup form validation states', async ({ page }) => {
    // Try to proceed without filling required fields
    const submitButton = page.locator('button').filter({ hasText: /submit|save|next/i }).first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    await expect(page).toHaveScreenshot('campaign-setup-validation-errors.png', {
      fullPage: true,
    });
  });

  test('campaign setup success state', async ({ page }) => {
    // Fill minimal required fields
    const titleInput = page.locator('input').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Campaign');
    }

    const textareaInput = page.locator('textarea').first();
    if (await textareaInput.isVisible()) {
      await textareaInput.fill('Test description');
    }

    // Look for success confirmation
    const successMessage = page.locator('.success, .complete, [data-testid*="success"]').first();
    if (await successMessage.isVisible()) {
      await expect(page).toHaveScreenshot('campaign-setup-success.png', {
        fullPage: true,
      });
    }
  });
});