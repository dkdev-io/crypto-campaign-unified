#!/usr/bin/env node

/**
 * Simple test to verify validation fix is applied
 * Checks if the smart contract validation is being called
 */

const puppeteer = require('puppeteer');

async function testValidationFix() {
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Open DevTools to see console
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Listen to console messages to see validation calls
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('smart contract') || 
        text.includes('Web3') || 
        text.includes('validation') ||
        text.includes('Checking contribution limits')) {
    }
  });
  
  try {
    await page.goto('http://localhost:5173/?campaign=fefd5286-e859-48c9-95e6-0a743837acb3', {
      waitUntil: 'domcontentloaded'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    
    // Enter email first
    const emailField = await page.$('input[name*="email"], input[type="email"]');
    if (emailField) {
      await emailField.type('test@example.com');
    }
    
    // Enter amount to trigger validation
    const amountField = await page.$('input[name*="amount"], input[placeholder*="amount"]');
    if (amountField) {
      await amountField.type('100');
    }
    
    // Wait for validation to run
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    
    // Check page content for validation messages
    const pageContent = await page.evaluate(() => {
      const content = document.body.innerText;
      return {
        hasWalletWarning: content.includes('Wallet') && content.includes('Required'),
        hasValidationMessage: content.includes('validation') || content.includes('Validation'),
        hasWeb3Message: content.includes('Web3') || content.includes('MetaMask'),
        hasSmartContract: content.includes('smart contract') || content.includes('Smart Contract'),
        hasFECCompliance: content.includes('FEC') && content.includes('compliance')
      };
    });
    
    console.log('\n📊 VALIDATION CHECK RESULTS:');
    console.log(`   Wallet Warning: ${pageContent.hasWalletWarning ? '✅' : '❌'}`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/validation-fix-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved: test-results/validation-fix-check.png');
    
    // Check if any validation is working
    const validationActive = pageContent.hasWalletWarning || 
                            pageContent.hasValidationMessage || 
                            pageContent.hasSmartContract;
    
    if (validationActive) {
      console.log('\n✅ SUCCESS: Validation fix appears to be active!');
    } else {
      console.log('\n⚠️ WARNING: Validation fix may not be active');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
}

testValidationFix();