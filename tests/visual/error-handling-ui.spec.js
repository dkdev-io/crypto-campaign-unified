import { test, expect } from '@playwright/test';
import { waitForStableState, testContributor } from '../fixtures/test-data.js';

test.describe('Error Handling UI Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForStableState(page);
  });

  test('form validation errors - empty fields', async ({ page }) => {
    // Submit empty form to trigger all validation errors
    const submitButton = page
      .locator('button[type="submit"], .submit-btn, [data-testid="submit-button"]')
      .first();

    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1500); // Wait for validation to appear

      await expect(page).toHaveScreenshot('validation-errors-empty-form.png', {
        fullPage: true,
      });
    }
  });

  test('individual field validation errors', async ({ page }) => {
    const fieldTests = [
      {
        selector: 'input[name="email"], input[type="email"]',
        value: 'invalid-email',
        errorType: 'invalid-email',
      },
      {
        selector: 'input[name="amount"], input[type="number"]',
        value: '-50',
        errorType: 'negative-amount',
      },
      {
        selector: 'input[name="amount"], input[type="number"]',
        value: '0',
        errorType: 'zero-amount',
      },
      {
        selector: 'input[name="name"], input[name="donorName"]',
        value: 'a',
        errorType: 'short-name',
      },
    ];

    for (const fieldTest of fieldTests) {
      const field = page.locator(fieldTest.selector).first();
      if (await field.isVisible()) {
        await field.fill(fieldTest.value);
        await field.blur(); // Trigger validation
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot(`validation-error-${fieldTest.errorType}.png`, {
          fullPage: true,
        });

        // Clear field for next test
        await field.fill('');
      }
    }
  });

  test('network connection error', async ({ page }) => {
    // Mock network error
    await page.route('**/*', (route) => {
      if (route.request().method() === 'POST') {
        route.abort('connectionfailed');
      } else {
        route.continue();
      }
    });

    // Fill and submit form to trigger network error
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

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(3000); // Wait for network timeout

      await expect(page).toHaveScreenshot('network-connection-error.png', {
        fullPage: true,
      });
    }
  });

  test('server error responses', async ({ page }) => {
    const serverErrors = [
      { status: 400, message: 'Bad Request - Invalid form data' },
      { status: 401, message: 'Unauthorized - Authentication required' },
      { status: 403, message: 'Forbidden - Access denied' },
      { status: 404, message: 'Not Found - Campaign not found' },
      { status: 500, message: 'Internal Server Error - Please try again' },
      { status: 503, message: 'Service Unavailable - Server maintenance' },
    ];

    for (const error of serverErrors) {
      // Mock server error response
      await page.route('**/*', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: error.status,
            contentType: 'application/json',
            body: JSON.stringify({ error: error.message }),
          });
        } else {
          route.continue();
        }
      });

      // Fill and submit form
      const nameInput = page.locator('input[name="name"], input[name="donorName"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');

        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);

          await expect(page).toHaveScreenshot(`server-error-${error.status}.png`, {
            fullPage: true,
          });
        }
      }

      // Reset for next test
      await page.reload();
      await waitForStableState(page);
    }
  });

  test('wallet connection errors', async ({ page }) => {
    const walletErrors = [
      {
        name: 'user-rejected',
        mockError: 'User rejected the request',
      },
      {
        name: 'no-wallet',
        mockError: 'No Ethereum provider found',
      },
      {
        name: 'network-error',
        mockError: 'Network connection failed',
      },
      {
        name: 'insufficient-funds',
        mockError: 'Insufficient funds for gas',
      },
    ];

    for (const walletError of walletErrors) {
      await page.addInitScript((errorMsg) => {
        window.ethereum = {
          isMetaMask: true,
          request: async () => {
            throw new Error(errorMsg);
          },
        };
      }, walletError.mockError);

      await page.reload();
      await waitForStableState(page);

      const connectButton = page
        .locator('button')
        .filter({ hasText: /connect.*wallet|wallet.*connect/i })
        .first();

      if (await connectButton.isVisible()) {
        await connectButton.click();
        await page.waitForTimeout(2000);

        await expect(page).toHaveScreenshot(`wallet-error-${walletError.name}.png`, {
          fullPage: true,
        });
      }
    }
  });

  test('transaction failed errors', async ({ page }) => {
    // Mock successful wallet connection but failed transaction
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (request.method === 'eth_sendTransaction') {
            throw new Error('Transaction failed: insufficient funds');
          }
          return null;
        },
      };
    });

    await page.reload();
    await waitForStableState(page);

    // Fill and submit donation form
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('100');

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        await expect(page).toHaveScreenshot('transaction-failed-error.png', {
          fullPage: true,
        });
      }
    }
  });

  test('timeout errors', async ({ page }) => {
    // Mock slow response leading to timeout
    await page.route('**/*', (route) => {
      if (route.request().method() === 'POST') {
        // Don't respond, causing timeout
        return; // This will cause the request to hang
      } else {
        route.continue();
      }
    });

    const nameInput = page.locator('input[name="name"], input[name="donorName"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Timeout Test');

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for timeout error to appear
        await page.waitForTimeout(10000);

        await expect(page).toHaveScreenshot('request-timeout-error.png', {
          fullPage: true,
        });
      }
    }
  });

  test('file upload errors', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible()) {
      // Test file too large error
      await page.setInputFiles(fileInput, {
        name: 'large-file.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB file
      });

      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('file-too-large-error.png', {
        fullPage: true,
      });

      // Test invalid file type error
      await page.setInputFiles(fileInput, {
        name: 'invalid-file.exe',
        mimeType: 'application/exe',
        buffer: Buffer.from('fake exe content'),
      });

      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('invalid-file-type-error.png', {
        fullPage: true,
      });
    }
  });

  test('campaign not found error', async ({ page }) => {
    // Navigate to non-existent campaign
    await page.goto('/campaign/nonexistent-campaign');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('campaign-not-found-error.png', {
      fullPage: true,
    });
  });

  test('error message mobile responsiveness', async ({ page }) => {
    const mobileViewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
    ];

    for (const viewport of mobileViewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      await waitForStableState(page);

      // Trigger validation error
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1500);

        await expect(page).toHaveScreenshot(`validation-errors-${viewport.name}.png`, {
          fullPage: true,
        });
      }
    }
  });

  test('error notification banners', async ({ page }) => {
    // Mock API error that triggers notification banner
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Service temporarily unavailable. Please try again in a few minutes.',
        }),
      });
    });

    await page.reload();
    await waitForStableState(page);

    // Trigger any API call
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.click();
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('error-notification-banner.png', {
        fullPage: true,
      });
    }
  });

  test('error modal dialogs', async ({ page }) => {
    // Mock critical error that shows modal
    await page.addInitScript(() => {
      // Simulate critical error after page load
      setTimeout(() => {
        const modal = document.createElement('div');
        modal.className = 'error-modal';
        modal.innerHTML = `
          <div class="modal-backdrop"></div>
          <div class="modal-content">
            <h2>Critical Error</h2>
            <p>Unable to connect to the blockchain network. Please check your connection and try again.</p>
            <button>Retry</button>
            <button>Cancel</button>
          </div>
        `;
        document.body.appendChild(modal);
      }, 1000);
    });

    await page.reload();
    await page.waitForTimeout(2000);

    const modal = page.locator('.error-modal, .modal, [role="dialog"]').first();
    if (await modal.isVisible()) {
      await expect(page).toHaveScreenshot('error-modal-dialog.png', {
        fullPage: true,
      });
    }
  });

  test('error recovery flows', async ({ page }) => {
    // Test retry button functionality
    await page.route('**/*', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error - please retry' }),
        });
      } else {
        route.continue();
      }
    });

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Look for retry button
      const retryButton = page
        .locator('button')
        .filter({ hasText: /retry|try again/i })
        .first();
      if (await retryButton.isVisible()) {
        await retryButton.hover();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('error-retry-button-hover.png', {
          fullPage: true,
        });
      }
    }
  });
});
