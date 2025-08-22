import { test, expect } from '@playwright/test';
import { waitForStableState } from '../fixtures/test-data.js';

test.describe('Wallet Connection States Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForStableState(page);
  });

  test('wallet disconnected initial state', async ({ page }) => {
    // Look for wallet connection buttons or indicators
    const walletSection = page.locator('[data-testid*="wallet"], .wallet, .web3, [class*="wallet"]').first();
    
    if (await walletSection.isVisible()) {
      await expect(walletSection).toHaveScreenshot('wallet-disconnected-state.png');
    } else {
      // Fallback: capture area where wallet UI should be
      await expect(page).toHaveScreenshot('wallet-initial-state.png', {
        fullPage: true,
      });
    }
  });

  test('wallet connection prompt modal', async ({ page }) => {
    const connectButton = page.locator('button').filter({ hasText: /connect.*wallet|wallet.*connect/i }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(1000); // Wait for modal to appear
      
      // Look for modal or dropdown
      const modal = page.locator('.modal, .popup, .dropdown, [role="dialog"]').first();
      if (await modal.isVisible()) {
        await expect(page).toHaveScreenshot('wallet-connection-modal.png', {
          fullPage: true,
        });
      }
    }
  });

  test('wallet provider selection screen', async ({ page }) => {
    const connectButton = page.locator('button').filter({ hasText: /connect.*wallet|wallet.*connect/i }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(1500);
      
      // Look for wallet provider options (MetaMask, WalletConnect, etc.)
      const providers = page.locator('[data-testid*="metamask"], [data-testid*="walletconnect"], .wallet-option, .provider');
      const providerCount = await providers.count();
      
      if (providerCount > 0) {
        await expect(page).toHaveScreenshot('wallet-provider-selection.png', {
          fullPage: true,
        });
      }
    }
  });

  test('wallet connecting loading state', async ({ page }) => {
    // Mock wallet connection in progress
    await page.addInitScript(() => {
      // Mock Web3 wallet connecting state
      window.ethereum = {
        isMetaMask: true,
        request: () => new Promise(resolve => {
          // Don't resolve immediately to simulate loading
          setTimeout(() => resolve(['0x1234567890123456789012345678901234567890']), 5000);
        })
      };
    });

    const connectButton = page.locator('button').filter({ hasText: /connect.*wallet|wallet.*connect/i }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(1000); // Capture loading state
      
      // Look for loading indicators
      const loadingElements = page.locator('.loading, .spinner, .connecting, [data-testid*="loading"]');
      const hasLoading = await loadingElements.count() > 0;
      
      if (hasLoading) {
        await expect(page).toHaveScreenshot('wallet-connecting-loading.png', {
          fullPage: true,
        });
      }
    }
  });

  test('wallet connected success state', async ({ page }) => {
    // Mock successful wallet connection
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (request.method === 'eth_getBalance') {
            return '0x1bc16d674ec80000'; // 2 ETH in wei
          }
          return null;
        }
      };
    });

    const connectButton = page.locator('button').filter({ hasText: /connect.*wallet|wallet.*connect/i }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(2000); // Wait for connection to complete
      
      await expect(page).toHaveScreenshot('wallet-connected-success.png', {
        fullPage: true,
      });
    }
  });

  test('wallet address display and formatting', async ({ page }) => {
    // Mock wallet with address
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        request: async () => ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']
      };
    });

    await page.reload();
    await waitForStableState(page);

    // Look for wallet address display
    const addressDisplay = page.locator('[data-testid*="address"], .wallet-address, .address').first();
    if (await addressDisplay.isVisible()) {
      await expect(addressDisplay).toHaveScreenshot('wallet-address-display.png');
    }

    await expect(page).toHaveScreenshot('wallet-with-address-full.png', {
      fullPage: true,
    });
  });

  test('wallet balance display', async ({ page }) => {
    // Mock wallet with balance
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (request.method === 'eth_getBalance') {
            return '0x6F05B59D3B20000'; // 0.5 ETH in wei
          }
          return null;
        }
      };
    });

    const connectButton = page.locator('button').filter({ hasText: /connect.*wallet|wallet.*connect/i }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(2000);
      
      // Look for balance display
      const balanceDisplay = page.locator('[data-testid*="balance"], .balance, .wallet-balance').first();
      if (await balanceDisplay.isVisible()) {
        await expect(balanceDisplay).toHaveScreenshot('wallet-balance-display.png');
      }

      await expect(page).toHaveScreenshot('wallet-with-balance-full.png', {
        fullPage: true,
      });
    }
  });

  test('wallet network indicator', async ({ page }) => {
    // Mock different networks
    const networks = [
      { name: 'ethereum', chainId: '0x1', networkName: 'Ethereum Mainnet' },
      { name: 'polygon', chainId: '0x89', networkName: 'Polygon' },
      { name: 'bsc', chainId: '0x38', networkName: 'BSC' }
    ];

    for (const network of networks) {
      await page.addInitScript((net) => {
        window.ethereum = {
          isMetaMask: true,
          chainId: net.chainId,
          networkVersion: net.chainId,
          selectedAddress: '0x1234567890123456789012345678901234567890',
          request: async (request) => {
            if (request.method === 'eth_chainId') return net.chainId;
            if (request.method === 'eth_requestAccounts') {
              return ['0x1234567890123456789012345678901234567890'];
            }
            return null;
          }
        };
      }, network);

      await page.reload();
      await waitForStableState(page);

      await expect(page).toHaveScreenshot(`wallet-network-${network.name}.png`, {
        fullPage: true,
      });
    }
  });

  test('wallet disconnect action', async ({ page }) => {
    // Mock connected wallet
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async () => ['0x1234567890123456789012345678901234567890']
      };
    });

    await page.reload();
    await waitForStableState(page);

    // Look for disconnect button
    const disconnectButton = page.locator('button').filter({ hasText: /disconnect|logout/i }).first();
    
    if (await disconnectButton.isVisible()) {
      await disconnectButton.hover();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('wallet-disconnect-hover.png', {
        fullPage: true,
      });

      await disconnectButton.click();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('wallet-after-disconnect.png', {
        fullPage: true,
      });
    }
  });

  test('wallet connection error states', async ({ page }) => {
    // Mock wallet connection error
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        request: async () => {
          throw new Error('User rejected the request');
        }
      };
    });

    const connectButton = page.locator('button').filter({ hasText: /connect.*wallet|wallet.*connect/i }).first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(2000);
      
      // Look for error messages
      const errorElements = page.locator('.error, .alert-error, [data-testid*="error"]');
      const hasError = await errorElements.count() > 0;
      
      if (hasError) {
        await expect(page).toHaveScreenshot('wallet-connection-error.png', {
          fullPage: true,
        });
      }
    }
  });

  test('wallet mobile responsive states', async ({ page }) => {
    const mobileViewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 }
    ];

    // Mock connected wallet for mobile testing
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async () => ['0x1234567890123456789012345678901234567890']
      };
    });

    for (const viewport of mobileViewports) {
      await page.setViewportSize(viewport);
      await page.reload();
      await waitForStableState(page);

      await expect(page).toHaveScreenshot(`wallet-${viewport.name}-view.png`, {
        fullPage: true,
      });
    }
  });

  test('wallet transaction signing interface', async ({ page }) => {
    // Mock transaction signing
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (request.method === 'eth_sendTransaction') {
            // Simulate transaction signing UI
            return '0x1234567890abcdef';
          }
          return null;
        }
      };
    });

    // Fill out donation form and attempt to submit
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('0.1');
      
      const submitButton = page.locator('button[type="submit"], .submit-btn').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1500);
        
        await expect(page).toHaveScreenshot('wallet-transaction-signing.png', {
          fullPage: true,
        });
      }
    }
  });

  test('wallet switching accounts', async ({ page }) => {
    // Mock multiple accounts
    const accounts = [
      '0x1234567890123456789012345678901234567890',
      '0x0987654321098765432109876543210987654321',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    ];

    for (let i = 0; i < accounts.length; i++) {
      await page.addInitScript((account) => {
        window.ethereum = {
          isMetaMask: true,
          selectedAddress: account,
          request: async () => [account]
        };
      }, accounts[i]);

      await page.reload();
      await waitForStableState(page);

      await expect(page).toHaveScreenshot(`wallet-account-${i + 1}.png`, {
        fullPage: true,
      });
    }
  });
});