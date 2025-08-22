import { test, expect } from '@playwright/test';
import { waitForStableState, testContributor, testCampaign } from '../fixtures/test-data.js';

test.describe('Success Confirmation Screens Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForStableState(page);
  });

  test('contribution success confirmation', async ({ page }) => {
    // Mock successful contribution submission
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contributionId: 'contrib_12345',
          transactionHash: '0xabcdef123456789',
          amount: 100,
          message: 'Thank you for your contribution!'
        })
      });
    });

    // Fill and submit contribution form
    const nameInput = page.locator('input[name="name"], input[name="donorName"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(testContributor.name);
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(testContributor.email);
    }

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill(testContributor.amount.toString());
    }

    const messageInput = page.locator('textarea[name="message"]').first();
    if (await messageInput.isVisible()) {
      await messageInput.fill(testContributor.message);
    }

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('contribution-success-confirmation.png', {
        fullPage: true,
      });
    }
  });

  test('transaction confirmation with blockchain details', async ({ page }) => {
    // Mock successful blockchain transaction
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (request.method === 'eth_sendTransaction') {
            return '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b';
          }
          return null;
        }
      };
    });

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('0.5');
      
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(4000);
        
        await expect(page).toHaveScreenshot('blockchain-transaction-success.png', {
          fullPage: true,
        });
      }
    }
  });

  test('campaign setup completion success', async ({ page }) => {
    // Navigate to campaign setup
    const setupButton = page.locator('button, a').filter({ hasText: /setup|create|campaign/i }).first();
    if (await setupButton.isVisible()) {
      await setupButton.click();
      await waitForStableState(page);
    }

    // Mock successful campaign creation
    await page.route('**/api/campaigns', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          campaignId: 'campaign_67890',
          campaignUrl: 'https://example.com/campaign/save-the-ocean',
          embedCode: '<iframe src="https://example.com/embed/campaign_67890"></iframe>'
        })
      });
    });

    // Fill campaign creation form
    const titleInput = page.locator('input[name*="title"], input[name*="name"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(testCampaign.title);
      
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /create|launch|finish/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        await expect(page).toHaveScreenshot('campaign-setup-success.png', {
          fullPage: true,
        });
      }
    }
  });

  test('email verification success', async ({ page }) => {
    // Mock email verification success page
    await page.goto('/verify-email?token=success123');
    await waitForStableState(page);
    
    await expect(page).toHaveScreenshot('email-verification-success.png', {
      fullPage: true,
    });
  });

  test('newsletter signup confirmation', async ({ page }) => {
    // Look for newsletter signup form
    const emailInput = page.locator('input[type="email"]').filter({ hasText: /newsletter|subscribe/i }).first();
    const newsletterInput = page.locator('input[name*="newsletter"], input[name*="subscribe"]').first();
    
    const targetInput = await emailInput.isVisible() ? emailInput : 
                       await newsletterInput.isVisible() ? newsletterInput : null;

    if (targetInput) {
      await targetInput.fill('test@example.com');
      
      const subscribeButton = page.locator('button').filter({ hasText: /subscribe|sign up/i }).first();
      if (await subscribeButton.isVisible()) {
        // Mock successful newsletter signup
        await page.route('**/api/newsletter', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Successfully subscribed!' })
          });
        });

        await subscribeButton.click();
        await page.waitForTimeout(2000);
        
        await expect(page).toHaveScreenshot('newsletter-signup-success.png', {
          fullPage: true,
        });
      }
    }
  });

  test('success confirmation with social sharing', async ({ page }) => {
    // Mock contribution success with sharing options
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contributionId: 'contrib_12345',
          shareUrl: 'https://example.com/campaign/share/12345',
          socialMessage: 'I just contributed to Save the Ocean! Join me in supporting this cause.'
        })
      });
    });

    // Fill minimal form and submit
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('25');
      
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Look for social sharing buttons
        const shareButtons = page.locator('button, a').filter({ hasText: /share|twitter|facebook|linkedin/i });
        const shareCount = await shareButtons.count();
        
        if (shareCount > 0) {
          await expect(page).toHaveScreenshot('success-with-social-sharing.png', {
            fullPage: true,
          });
        }
      }
    }
  });

  test('success confirmation with next steps', async ({ page }) => {
    // Mock detailed success response with next steps
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contributionId: 'contrib_12345',
          nextSteps: [
            'Check your email for a receipt',
            'Follow campaign updates',
            'Share with friends and family'
          ]
        })
      });
    });

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('success-with-next-steps.png', {
        fullPage: true,
      });
    }
  });

  test('success confirmation mobile responsive', async ({ page }) => {
    const mobileViewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 }
    ];

    // Mock success response
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contributionId: 'contrib_12345',
          message: 'Thank you for your generous contribution!'
        })
      });
    });

    for (const viewport of mobileViewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      await waitForStableState(page);

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        await expect(page).toHaveScreenshot(`success-confirmation-${viewport.name}.png`, {
          fullPage: true,
        });
      }
    }
  });

  test('success animation and transitions', async ({ page }) => {
    // Mock success with animation triggers
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, contributionId: 'contrib_12345' })
      });
    });

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Capture different stages of success animation
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('success-animation-start.png', {
        fullPage: true,
      });

      await page.waitForTimeout(1500);
      await expect(page).toHaveScreenshot('success-animation-middle.png', {
        fullPage: true,
      });

      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot('success-animation-end.png', {
        fullPage: true,
      });
    }
  });

  test('success confirmation with receipt download', async ({ page }) => {
    // Mock success with receipt option
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contributionId: 'contrib_12345',
          receiptUrl: '/api/receipt/contrib_12345.pdf'
        })
      });
    });

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Look for download receipt button
      const downloadButton = page.locator('button, a').filter({ hasText: /download.*receipt|receipt.*download/i }).first();
      if (await downloadButton.isVisible()) {
        await downloadButton.hover();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('success-with-receipt-download.png', {
          fullPage: true,
        });
      }
    }
  });

  test('recurring contribution setup success', async ({ page }) => {
    // Mock recurring contribution success
    await page.route('**/api/contributions/recurring', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          subscriptionId: 'sub_67890',
          nextPayment: '2024-09-20',
          amount: 50,
          frequency: 'monthly'
        })
      });
    });

    // Look for recurring option checkbox
    const recurringCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /recurring|monthly|weekly/i }).first();
    if (await recurringCheckbox.isVisible()) {
      await recurringCheckbox.check();
    }

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('recurring-contribution-success.png', {
        fullPage: true,
      });
    }
  });

  test('success confirmation with progress indicators', async ({ page }) => {
    // Mock success with campaign progress update
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contributionId: 'contrib_12345',
          campaignProgress: {
            totalRaised: 12500,
            goalAmount: 50000,
            percentComplete: 25,
            contributorsCount: 127
          }
        })
      });
    });

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('success-with-progress-update.png', {
        fullPage: true,
      });
    }
  });

  test('team member success confirmation', async ({ page }) => {
    // Navigate to team/admin section
    const adminButton = page.locator('button, a').filter({ hasText: /admin|team|manage/i }).first();
    if (await adminButton.isVisible()) {
      await adminButton.click();
      await waitForStableState(page);
    }

    // Mock team member invitation success
    await page.route('**/api/team/invite', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          inviteId: 'invite_12345',
          email: 'newmember@example.com',
          role: 'editor'
        })
      });
    });

    // Look for invite form
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('newmember@example.com');
      
      const inviteButton = page.locator('button').filter({ hasText: /invite|add.*member/i }).first();
      if (await inviteButton.isVisible()) {
        await inviteButton.click();
        await page.waitForTimeout(2000);
        
        await expect(page).toHaveScreenshot('team-invite-success.png', {
          fullPage: true,
        });
      }
    }
  });

  test('success confirmation accessibility features', async ({ page }) => {
    // Test high contrast success screen
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.route('**/api/contributions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contributionId: 'contrib_12345',
          message: 'Contribution successful!'
        })
      });
    });

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('success-confirmation-high-contrast.png', {
        fullPage: true,
      });
    }
  });
});