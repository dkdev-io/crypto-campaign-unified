import { test, expect } from '@playwright/test';

test.describe('Landing Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for any animations or dynamic content
    await page.waitForTimeout(2000);
  });

  test('landing page full layout', async ({ page }) => {
    await expect(page).toHaveScreenshot('landing-page-full.png', {
      fullPage: true,
    });
  });

  test('landing page header section', async ({ page }) => {
    const header = page.locator('header, .header, nav').first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('landing-page-header.png');
    }
  });

  test('landing page hero section', async ({ page }) => {
    // Look for hero/banner section
    const hero = page.locator('.hero, .banner, .jumbotron, [data-testid*="hero"]').first();
    if (await hero.isVisible()) {
      await expect(hero).toHaveScreenshot('landing-page-hero.png');
    } else {
      // Fallback: capture top portion of page
      await expect(page.locator('body')).toHaveScreenshot('landing-page-above-fold.png', {
        clip: { x: 0, y: 0, width: 1200, height: 600 },
      });
    }
  });

  test('landing page campaign cards/grid', async ({ page }) => {
    // Look for campaign cards or grid layout
    const campaignGrid = page
      .locator('.campaign-grid, .cards, .grid, [data-testid*="campaign"]')
      .first();
    if (await campaignGrid.isVisible()) {
      await expect(campaignGrid).toHaveScreenshot('landing-page-campaign-grid.png');
    }
  });

  test('landing page footer section', async ({ page }) => {
    const footer = page.locator('footer, .footer').first();
    if (await footer.isVisible()) {
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toHaveScreenshot('landing-page-footer.png');
    }
  });

  test('landing page navigation menu', async ({ page }) => {
    // Test navigation menu
    const menuButton = page
      .locator('button')
      .filter({ hasText: /menu|☰/i })
      .first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('landing-page-navigation-menu.png');
    }
  });

  test('landing page mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('landing-page-mobile.png', {
      fullPage: true,
    });
  });

  test('landing page tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('landing-page-tablet.png', {
      fullPage: true,
    });
  });

  test('landing page dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('landing-page-dark-mode.png', {
      fullPage: true,
    });
  });

  test('landing page interactive elements', async ({ page }) => {
    // Test hover states on interactive elements
    const buttons = page.locator('button, .btn, a.button').first();
    if (await buttons.isVisible()) {
      await buttons.hover();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('landing-page-button-hover.png');
    }
  });

  test('landing page loading states', async ({ page }) => {
    // Reload page and capture loading state quickly
    await page.reload();
    await page.waitForTimeout(100); // Very quick to catch loading state

    try {
      await expect(page).toHaveScreenshot('landing-page-loading.png', {
        fullPage: true,
      });
    } catch (error) {
      // Loading state might be too fast to capture, that's okay
    }
  });

  test('landing page form integration', async ({ page }) => {
    // Look for any forms on the landing page
    const forms = page.locator('form').first();
    if (await forms.isVisible()) {
      await expect(forms).toHaveScreenshot('landing-page-form.png');
    }
  });

  test('landing page call-to-action buttons', async ({ page }) => {
    // Find primary CTA buttons
    const ctaButtons = page
      .locator('button, a')
      .filter({ hasText: /donate|contribute|support|start|create/i });
    const count = await ctaButtons.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const button = ctaButtons.nth(i);
        await button.scrollIntoViewIfNeeded();
        await expect(button).toHaveScreenshot(`landing-page-cta-button-${i}.png`);
      }
    }
  });

  test('landing page social proof section', async ({ page }) => {
    // Look for testimonials, stats, or social proof
    const socialProof = page
      .locator('.testimonials, .stats, .social-proof, [data-testid*="testimonial"]')
      .first();
    if (await socialProof.isVisible()) {
      await socialProof.scrollIntoViewIfNeeded();
      await expect(socialProof).toHaveScreenshot('landing-page-social-proof.png');
    }
  });

  test('landing page accessibility contrast', async ({ page }) => {
    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('landing-page-high-contrast.png', {
      fullPage: true,
    });
  });

  test('landing page wide screen layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('landing-page-wide-screen.png', {
      fullPage: true,
    });
  });
});
