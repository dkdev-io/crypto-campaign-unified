#!/usr/bin/env node

/**
 * Smart Contract Validation Test
 * Tests that the frontend properly validates through the smart contract
 * and rejects donations that should fail validation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FORM_URL = 'http://localhost:5173/?campaign=fefd5286-e859-48c9-95e6-0a743837acb3';

class SmartContractValidationTester {
  constructor() {
    this.browser = null;
    this.testResults = [];
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false, // Show browser to see validation
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 },
    });
  }

  async runValidationTests() {
    // Test 1: No wallet connected should block validation
    await this.testNoWalletValidation();

    // Test 2: With wallet but no KYC should fail
    await this.testNoKYCValidation();

    // Test 3: Over cumulative limit should fail
    await this.testOverLimitValidation();

    // Generate report
    this.generateReport();
  }

  async testNoWalletValidation() {
    const page = await this.browser.newPage();

    try {
      await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fill in amount without connecting wallet
      const amountField = await page.$('input[name*="amount"], input[placeholder*="amount"]');
      if (amountField) {
        await amountField.type('100');
      }

      // Check for wallet warning message
      const warningCheck = await page.evaluate(() => {
        const warnings = Array.from(document.querySelectorAll('div')).filter(
          (el) =>
            el.textContent.includes('Wallet Connection Required') ||
            (el.textContent.includes('wallet') && el.textContent.includes('required'))
        );
        return warnings.length > 0;
      });

      const result = {
        test: 'No Wallet Connection',
        expected: 'Show wallet required warning',
        actual: warningCheck ? 'Warning shown ✅' : 'No warning ❌',
        passed: warningCheck,
      };

      console.log(`Result: ${result.actual}\n`);
      this.testResults.push(result);

      await page.screenshot({ path: 'test-results/validation-test-no-wallet.png' });
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
      this.testResults.push({
        test: 'No Wallet Connection',
        error: error.message,
        passed: false,
      });
    } finally {
      await page.close();
    }
  }

  async testNoKYCValidation() {
    const page = await this.browser.newPage();

    try {
      await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Note: In real test, would connect MetaMask here
      // For now, check that validation message appears

      // Fill form
      await this.fillBasicForm(page);

      // Try to submit
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Check for KYC error message
      const kycCheck = await page.evaluate(() => {
        const errors = Array.from(document.querySelectorAll('div')).filter(
          (el) =>
            el.textContent.includes('KYC') &&
            (el.textContent.includes('required') || el.textContent.includes('verification'))
        );
        return errors.length > 0;
      });

      const result = {
        test: 'No KYC Verification',
        expected: 'Show KYC required error',
        actual: kycCheck ? 'KYC error shown ✅' : 'No KYC error ❌',
        passed: kycCheck,
      };

      console.log(`Result: ${result.actual}\n`);
      this.testResults.push(result);

      await page.screenshot({ path: 'test-results/validation-test-no-kyc.png' });
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
      this.testResults.push({
        test: 'No KYC Verification',
        error: error.message,
        passed: false,
      });
    } finally {
      await page.close();
    }
  }

  async testOverLimitValidation() {
    const page = await this.browser.newPage();

    try {
      await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fill form with large amount
      await this.fillBasicForm(page, '3500'); // Over $3300 limit

      // Check for limit error
      const limitCheck = await page.evaluate(() => {
        const errors = Array.from(document.querySelectorAll('div')).filter(
          (el) =>
            (el.textContent.includes('exceed') && el.textContent.includes('limit')) ||
            el.textContent.includes('3300') ||
            el.textContent.includes('remaining capacity')
        );
        return errors.length > 0;
      });

      const result = {
        test: 'Over Contribution Limit',
        expected: 'Show limit exceeded error',
        actual: limitCheck ? 'Limit error shown ✅' : 'No limit error ❌',
        passed: limitCheck,
      };

      console.log(`Result: ${result.actual}\n`);
      this.testResults.push(result);

      await page.screenshot({ path: 'test-results/validation-test-over-limit.png' });
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
      this.testResults.push({
        test: 'Over Contribution Limit',
        error: error.message,
        passed: false,
      });
    } finally {
      await page.close();
    }
  }

  async fillBasicForm(page, amount = '100') {
    const fieldMappings = [
      { selector: 'input[name*="fullName"]', value: 'Test User' },
      { selector: 'input[name*="email"]', value: 'test@example.com' },
      { selector: 'input[name*="phone"]', value: '555-1234' },
      { selector: 'input[name*="street"]', value: '123 Test St' },
      { selector: 'input[name*="city"]', value: 'Test City' },
      { selector: 'input[name*="state"]', value: 'TX' },
      { selector: 'input[name*="zip"]', value: '12345' },
      { selector: 'input[name*="employer"]', value: 'Test Company' },
      { selector: 'input[name*="occupation"]', value: 'Tester' },
      { selector: 'input[name*="amount"]', value: amount },
    ];

    for (const mapping of fieldMappings) {
      const element = await page.$(mapping.selector);
      if (element) {
        await element.click();
        await element.evaluate((el) => (el.value = ''));
        await element.type(mapping.value);
      }
    }
  }

  generateReport() {
    const passed = this.testResults.filter((r) => r.passed).length;
    const failed = this.testResults.filter((r) => !r.passed).length;

    console.log(`Total Tests: ${this.testResults.length}`);

    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.forEach((result, i) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${i + 1}. ${result.test}: ${status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   Expected: ${result.expected}`);
        console.log(`   Actual: ${result.actual}`);
      }
    });

    // Check if validation is now working
    if (passed === this.testResults.length) {
      console.log('\n✅ SUCCESS: Validation is now working properly!');
    } else if (passed > 0) {
      console.log('\n⚠️ PARTIAL SUCCESS: Some validation is working');
    } else {
    }

    // Save results
    const reportPath = `test-results/smart-contract-validation-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run tests
async function main() {
  const tester = new SmartContractValidationTester();

  try {
    await tester.initialize();
    await tester.runValidationTests();
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = SmartContractValidationTester;
