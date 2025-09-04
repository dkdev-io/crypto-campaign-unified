#!/usr/bin/env node

/**
 * Final validation test on updated server
 * Tests that the fix is working on port 5174
 */

const puppeteer = require('puppeteer');

async function testFinalValidation() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 500,
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5174/?campaign=fefd5286-e859-48c9-95e6-0a743837acb3', {
      waitUntil: 'domcontentloaded',
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fill in email and amount to trigger validation
    const emailField = await page.$('input[name*="email"], input[type="email"]');
    if (emailField) {
      await emailField.type('test@example.com');
    }

    const amountField = await page.$(
      'input[name*="amount"], input[placeholder*="amount"], input[type="number"]'
    );
    if (amountField) {
      await amountField.type('100');
    }

    // Wait for validation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check for wallet warning
    const validationCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const divs = Array.from(document.querySelectorAll('div'));

      // Look for wallet warning
      const walletWarning = divs.find(
        (el) =>
          el.textContent.includes('Wallet Connection Required') ||
          (el.textContent.includes('wallet') && el.textContent.includes('validation'))
      );

      // Look for any validation-related text
      const hasValidation =
        bodyText.includes('validation') ||
        bodyText.includes('Validation') ||
        bodyText.includes('FEC compliance');

      return {
        hasWalletWarning: !!walletWarning,
        warningText: walletWarning ? walletWarning.textContent : null,
        hasValidationReference: hasValidation,
        pageHasAmount: bodyText.includes('100') || bodyText.includes('$100'),
      };
    });

    console.log('\n📊 VALIDATION TEST RESULTS:');
    console.log(
      `   🔍 Wallet warning present: ${validationCheck.hasWalletWarning ? 'YES ✅' : 'NO ❌'}`
    );

    if (validationCheck.warningText) {
      console.log(`\n   Warning message found:`);
      console.log(`   "${validationCheck.warningText.substring(0, 100)}..."`);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/final-validation-test.png', fullPage: true });
    console.log('\n📸 Screenshot: test-results/final-validation-test.png');

    // Final assessment
    if (validationCheck.hasWalletWarning) {
      console.log('\n✅ SUCCESS! Validation fix is working!');
    } else {
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testFinalValidation();
