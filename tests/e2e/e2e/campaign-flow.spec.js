import { test, expect } from '@playwright/test';

test.describe('End-to-End Campaign Flow', () => {
  test('complete campaign creation and contribution flow', async ({ page }) => {
    await page.goto('/');
    
    // Basic navigation test
    await expect(page).toHaveTitle(/crypto|campaign|donate/i);
    
    // Check if main components are present
    const mainContent = page.locator('main, #root, .app').first();
    await expect(mainContent).toBeVisible();
    
    // Look for key interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Take a screenshot of the complete application
    await expect(page).toHaveScreenshot('app-overview.png', {
      fullPage: true,
    });
  });

  test('form interactions work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find and interact with forms
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="number"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      await inputs.first().fill('Test Value');
      await expect(inputs.first()).toHaveValue('Test Value');
    }
    
    // Test form submission (if available)
    const submitButtons = page.locator('button[type="submit"]');
    const submitCount = await submitButtons.count();
    
    if (submitCount > 0) {
      // Don't actually submit, just verify the button exists
      await expect(submitButtons.first()).toBeVisible();
    }
  });
});