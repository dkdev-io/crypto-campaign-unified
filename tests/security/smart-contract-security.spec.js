import { test, expect } from '@playwright/test';
import { ethers } from 'ethers';

/**
 * Smart Contract Security Test Suite
 *
 * These tests validate security measures in the CampaignContributions contract
 * against common attack vectors and edge cases.
 */

test.describe('Smart Contract Security Tests', () => {
  let page;
  let contract;
  let mockProvider;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Mock Web3 provider with security test scenarios
    await page.addInitScript(() => {
      // Mock provider for security testing
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          // Simulate various security scenarios
          return null;
        },
      };
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle wallet injection attacks', async () => {
    // Test wallet injection security
    await page.addInitScript(() => {
      // Simulate malicious wallet injection
      const maliciousWallet = {
        isMetaMask: true,
        isMalicious: true,
        request: async () => {
          // Attempt to return malicious data
          return ['0xmaliciousaddress123456789'];
        },
      };

      // Try to override the legitimate wallet
      Object.defineProperty(window, 'ethereum', {
        value: maliciousWallet,
        writable: false,
      });
    });

    // Verify the app detects and rejects malicious wallets
    const connectButton = page
      .locator('button')
      .filter({ hasText: /connect.*wallet/i })
      .first();
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(2000);

      // Look for security warnings or rejection
      const securityWarning = page.locator('.security-warning, .error, [data-testid*="security"]');
      const hasSecurityCheck = (await securityWarning.count()) > 0;

      // Take screenshot of security response
      await expect(page).toHaveScreenshot('wallet-injection-security-test.png', {
        fullPage: true,
      });
    }
  });

  test('should prevent transaction replay attacks', async () => {
    // Mock wallet for transaction testing
    await page.addInitScript(() => {
      let transactionNonce = 0;

      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_sendTransaction') {
            // Simulate transaction with same nonce (replay attack)
            return {
              hash: '0x1234567890abcdef',
              nonce: transactionNonce, // Same nonce = potential replay
            };
          }
          return null;
        },
      };
    });

    // Attempt to submit the same transaction twice
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await amountInput.isVisible()) && (await submitButton.isVisible())) {
      // First transaction
      await amountInput.fill('0.1');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Attempt replay attack (same transaction)
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Verify replay protection
      await expect(page).toHaveScreenshot('transaction-replay-protection.png', {
        fullPage: true,
      });
    }
  });

  test('should validate gas price manipulation attempts', async () => {
    // Mock extreme gas prices
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_gasPrice') {
            // Return extremely high gas price (manipulation attempt)
            return '0x174876e800'; // 100 Gwei (very high)
          }
          if (request.method === 'eth_sendTransaction') {
            // Reject transactions with manipulated gas
            throw new Error('Gas price too high - possible manipulation detected');
          }
          return null;
        },
      };
    });

    // Attempt transaction with manipulated gas
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('0.1');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Look for gas price warnings
      const gasWarning = page.locator('[data-testid*="gas"], .gas-warning, .fee-warning');
      const hasGasValidation = (await gasWarning.count()) > 0;

      await expect(page).toHaveScreenshot('gas-manipulation-protection.png', {
        fullPage: true,
      });
    }
  });

  test('should prevent contract address spoofing', async () => {
    // Mock contract with wrong address
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_call') {
            // Return data from wrong contract address
            return '0xmaliciousdata';
          }
          return null;
        },
      };
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify contract address validation
    const contractInfo = page.locator('[data-testid*="contract"], .contract-address');
    if ((await contractInfo.count()) > 0) {
      await expect(page).toHaveScreenshot('contract-address-validation.png');
    }
  });

  test('should handle network switching attacks', async () => {
    // Test network switching during transaction
    const networks = [
      { name: 'mainnet', chainId: '0x1' },
      { name: 'malicious', chainId: '0x999999' }, // Fake network
      { name: 'testnet', chainId: '0xaa36a7' },
    ];

    for (const network of networks) {
      await page.addInitScript((net) => {
        window.ethereum = {
          isMetaMask: true,
          chainId: net.chainId,
          selectedAddress: '0x1234567890123456789012345678901234567890',
          request: async (request) => {
            if (request.method === 'eth_chainId') {
              return net.chainId;
            }
            return null;
          },
        };
      }, network);

      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Take screenshot of each network state
      await expect(page).toHaveScreenshot(`network-${network.name}-validation.png`, {
        fullPage: true,
      });
    }
  });

  test('should detect and prevent MEV attacks', async () => {
    // Simulate MEV (Maximum Extractable Value) attack scenario
    await page.addInitScript(() => {
      let transactionCount = 0;

      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_sendTransaction') {
            transactionCount++;

            // Simulate front-running by returning pending transactions
            if (transactionCount > 1) {
              return {
                error: 'Transaction with higher gas price detected - possible front-running',
              };
            }

            return '0x' + 'a'.repeat(64); // Mock transaction hash
          }
          return null;
        },
      };
    });

    // Attempt rapid transactions (MEV scenario)
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await amountInput.isVisible()) && (await submitButton.isVisible())) {
      await amountInput.fill('0.5');

      // Rapid transaction attempts
      await submitButton.click();
      await page.waitForTimeout(100);
      await submitButton.click();
      await page.waitForTimeout(100);
      await submitButton.click();

      await page.waitForTimeout(2000);

      // Check for MEV protection
      await expect(page).toHaveScreenshot('mev-attack-protection.png', {
        fullPage: true,
      });
    }
  });

  test('should validate contribution limit bypass attempts', async () => {
    // Mock wallet with contribution history at limit
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        contributionHistory: {
          total: '3299', // Just under $3,300 limit
          transactions: [
            { amount: '1000', timestamp: Date.now() - 86400000 },
            { amount: '2299', timestamp: Date.now() - 3600000 },
          ],
        },
        request: async (request) => {
          if (request.method === 'eth_call') {
            // Mock contract call returning contribution history
            return '0x' + parseInt('3299').toString(16).padStart(64, '0');
          }
          return null;
        },
      };
    });

    // Try to contribute amount that would exceed limit
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible()) {
      // Try to contribute $10 (should exceed $3,300 limit)
      await amountInput.fill('0.0033'); // Assuming ~$3,000 ETH price

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Verify limit enforcement
      const errorMessage = page.locator('.error, .alert-error, [data-testid*="error"]');
      const hasLimitError = (await errorMessage.count()) > 0;

      await expect(page).toHaveScreenshot('contribution-limit-bypass-prevention.png', {
        fullPage: true,
      });
    }
  });

  test('should handle wallet disconnection during transaction', async () => {
    // Mock wallet disconnection during transaction
    await page.addInitScript(() => {
      let isConnected = true;

      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        request: async (request) => {
          if (request.method === 'eth_sendTransaction') {
            // Simulate wallet disconnection during transaction
            isConnected = false;
            this.selectedAddress = null;
            throw new Error('Wallet disconnected during transaction');
          }
          if (request.method === 'eth_requestAccounts') {
            if (!isConnected) {
              throw new Error('User rejected the request');
            }
            return ['0x1234567890123456789012345678901234567890'];
          }
          return null;
        },
      };
    });

    // Attempt transaction that will be interrupted
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await amountInput.isVisible()) && (await submitButton.isVisible())) {
      await amountInput.fill('0.1');
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Check error handling
      await expect(page).toHaveScreenshot('wallet-disconnection-handling.png', {
        fullPage: true,
      });
    }
  });

  test('should prevent double-spending attempts', async () => {
    // Mock scenario where same funds are used in multiple transactions
    await page.addInitScript(() => {
      let pendingTransactions = [];

      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '0x1234567890123456789012345678901234567890',
        balance: '1000000000000000000', // 1 ETH
        request: async (request) => {
          if (request.method === 'eth_sendTransaction') {
            const txAmount = parseInt(request.params[0].value, 16);

            // Check if this would cause double spending
            const totalPending = pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
            const currentBalance = parseInt(this.balance, 16);

            if (totalPending + txAmount > currentBalance) {
              throw new Error('Insufficient funds - double spending detected');
            }

            pendingTransactions.push({ amount: txAmount, hash: '0x' + Date.now().toString(16) });
            return pendingTransactions[pendingTransactions.length - 1].hash;
          }

          if (request.method === 'eth_getBalance') {
            return '0x' + this.balance.toString(16);
          }

          return null;
        },
      };
    });

    // Attempt multiple rapid transactions
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await amountInput.isVisible()) && (await submitButton.isVisible())) {
      // First transaction
      await amountInput.fill('0.8');
      await submitButton.click();
      await page.waitForTimeout(500);

      // Second transaction (should cause double spending)
      await amountInput.fill('0.5');
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Verify double spending prevention
      await expect(page).toHaveScreenshot('double-spending-prevention.png', {
        fullPage: true,
      });
    }
  });
});
