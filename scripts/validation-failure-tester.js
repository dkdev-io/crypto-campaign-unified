#!/usr/bin/env node

/**
 * Validation Failure Tester
 * Specifically tests cases that SHOULD fail but are passing
 */

const fs = require('fs');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

const FORM_URL = 'http://localhost:5173/?campaign=fefd5286-e859-48c9-95e6-0a743837acb3';

class ValidationFailureTester {
  constructor() {
    this.prospects = [];
    this.validationFailures = [];
    this.testResults = [];
    this.browser = null;
  }

  async initialize() {
    // Load prospects and validation failures
    this.prospects = await this.loadCSV('../data/prospects.csv');
    this.validationFailures = JSON.parse(
      fs.readFileSync('test-results/validation-failures.json', 'utf8')
    );

    this.browser = await puppeteer.launch({
      headless: false, // Show browser to see what happens
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1400, height: 900 },
    });
  }

  async loadCSV(filepath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async testValidationFailureCase(failureCase, index) {
    const page = await this.browser.newPage();
    page.setDefaultTimeout(30000);

    const testResult = {
      ...failureCase,
      testIndex: index + 1,
      timestamp: new Date().toISOString(),
      actualResult: null,
      validationWorking: false,
    };

    try {
      // Navigate to form
      await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get prospect data
      const prospect = this.prospects.find((p) => p.unique_id === failureCase.unique_id);
      if (!prospect) {
        throw new Error('Prospect not found');
      }

      // Fill form with this specific person's data
      await this.fillFormForFailureCase(page, prospect, failureCase);

      // Submit form and check for validation
      const submitResult = await this.submitAndCheckValidation(page, failureCase);

      testResult.actualResult = submitResult;
      testResult.validationWorking = !submitResult.success; // Validation works if it failed

      if (submitResult.success) {
        console.log(`   Result: ✅ PASSED (BUG! Should have failed)`);
      } else {
        console.log(`   Result: ❌ FAILED (Correct! Validation working)`);
        console.log(`   ✅ Validation message: ${submitResult.message}`);
      }
    } catch (error) {
      console.log(`   Result: 💥 ERROR: ${error.message}`);
      testResult.actualResult = { success: false, error: error.message };
    } finally {
      await page.close();
    }

    return testResult;
  }

  async fillFormForFailureCase(page, prospect, failureCase) {
    const email = `${prospect.first_name.toLowerCase()}.${prospect.last_name.toLowerCase()}@test.com`;

    // Fill form fields
    const fieldMappings = [
      {
        selectors: ['input[name*="address"]', 'input[placeholder*="address"]'],
        value: prospect.address_line_1,
      },
      { selectors: ['input[name*="city"]', 'input[placeholder*="city"]'], value: prospect.city },
      { selectors: ['select[name*="state"]', 'input[name*="state"]'], value: prospect.state },
      { selectors: ['input[name*="zip"]', 'input[placeholder*="zip"]'], value: prospect.zip },
      { selectors: ['input[name*="amount"]', 'input[placeholder*="amount"]'], value: '100' }, // This should trigger over-limit
      {
        selectors: ['input[name*="wallet"]', 'input[placeholder*="wallet"]'],
        value: '0x742d35Cc6639C0532fCb5FbF7b51f4FA8B4B8B34',
      },
    ];

    for (const mapping of fieldMappings) {
      for (const selector of mapping.selectors) {
        try {
          const element = await page.$(selector);
          if (element && mapping.value) {
            const isVisible = await page.evaluate((el) => el.offsetParent !== null, element);
            if (isVisible) {
              await element.click();
              await element.evaluate((el) => (el.value = ''));
              await element.type(mapping.value.toString());
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }
    }
  }

  async submitAndCheckValidation(page, failureCase) {
    try {
      // Take screenshot before submission
      await page.screenshot({
        path: `test-results/validation-test-${failureCase.unique_id}-before.png`,
      });

      // Find and click submit button
      const submitButton = await page.$(
        'button[type="submit"], input[type="submit"], button:not([type="button"])'
      );
      if (!submitButton) {
        return { success: false, error: 'No submit button found' };
      }

      await submitButton.click();
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait longer to see validation

      // Take screenshot after submission
      await page.screenshot({
        path: `test-results/validation-test-${failureCase.unique_id}-after.png`,
      });

      // Check for validation error messages
      const validationCheck = await page.evaluate(() => {
        // Look for common validation error indicators
        const errorSelectors = [
          '.error',
          '.alert-error',
          '[class*="error"]',
          '.alert-danger',
          '[class*="danger"]',
          '.validation-error',
          '[class*="invalid"]',
          '.form-error',
          '[aria-invalid="true"]',
        ];

        for (const selector of errorSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            if (el.offsetParent !== null && el.textContent.trim()) {
              return {
                hasValidationError: true,
                message: el.textContent.trim(),
                selector: selector,
              };
            }
          }
        }

        // Check if form is still visible (might indicate validation error)
        const forms = document.querySelectorAll('form');
        const visibleForms = Array.from(forms).filter((f) => f.offsetParent !== null);

        // Check URL for success/error indicators
        const url = window.location.href;
        const isSuccessUrl = url.includes('success') || url.includes('thank');

        return {
          hasValidationError: false,
          formsStillVisible: visibleForms.length > 0,
          currentUrl: url,
          isSuccessUrl: isSuccessUrl,
          message: isSuccessUrl ? 'Redirected to success page' : 'No validation errors found',
        };
      });

      if (validationCheck.hasValidationError) {
        return {
          success: false,
          message: validationCheck.message,
          type: 'validation_error',
          details: validationCheck,
        };
      } else {
        return {
          success: true,
          message: validationCheck.message,
          type: 'no_validation',
          details: validationCheck,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Submit check failed: ${error.message}`,
        type: 'exception',
      };
    }
  }

  async runValidationTests() {
    for (let i = 0; i < Math.min(this.validationFailures.length, 5); i++) {
      // Test first 5 cases
      const failureCase = this.validationFailures[i];
      const result = await this.testValidationFailureCase(failureCase, i);
      this.testResults.push(result);

      // Brief pause between tests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    this.generateValidationReport();
  }

  generateValidationReport() {
    const totalTests = this.testResults.length;
    const validationWorking = this.testResults.filter((r) => r.validationWorking).length;
    const validationBroken = totalTests - validationWorking;

    console.log(`📊 VALIDATION RESULTS:`);

    if (validationBroken > 0) {
      const brokenCases = this.testResults.filter((r) => !r.validationWorking);
      brokenCases.forEach((result) => {
        console.log(`   ❌ ${result.name} (${result.failure_type})`);
        console.log(`      Issue: ${result.reason}`);
      });
    } else {
    }

    // Save results
    const reportPath = `test-results/validation-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run validation failure tests
async function main() {
  const tester = new ValidationFailureTester();

  try {
    await tester.initialize();
    await tester.runValidationTests();
  } catch (error) {
    console.error('💥 Validation testing failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = ValidationFailureTester;
