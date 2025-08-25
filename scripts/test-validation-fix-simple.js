#!/usr/bin/env node

/**
 * Simple test to verify validation fix is applied
 * Checks if the smart contract validation is being called
 */

const puppeteer = require('puppeteer');

async function testValidationFix() {
  console.log('🧪 Testing Validation Fix');
  console.log('Checking if smart contract validation is active...\n');
  
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
      console.log(`📋 Console: ${text}`);
    }
  });
  
  try {
    console.log('1. Loading form...');
    await page.goto('http://localhost:5173/?campaign=fefd5286-e859-48c9-95e6-0a743837acb3', {
      waitUntil: 'domcontentloaded'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('2. Entering amount to trigger validation...');
    
    // Enter email first
    const emailField = await page.$('input[name*="email"], input[type="email"]');
    if (emailField) {
      await emailField.type('test@example.com');
    }
    
    // Enter amount to trigger validation
    const amountField = await page.$('input[name*="amount"], input[placeholder*="amount"]');
    if (amountField) {
      await amountField.type('100');
      console.log('   Amount entered: $100');
    }
    
    // Wait for validation to run
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('3. Checking page for validation messages...');
    
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
    console.log(`   Validation Message: ${pageContent.hasValidationMessage ? '✅' : '❌'}`);
    console.log(`   Web3/MetaMask Reference: ${pageContent.hasWeb3Message ? '✅' : '❌'}`);
    console.log(`   Smart Contract Reference: ${pageContent.hasSmartContract ? '✅' : '❌'}`);
    console.log(`   FEC Compliance Reference: ${pageContent.hasFECCompliance ? '✅' : '❌'}`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/validation-fix-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved: test-results/validation-fix-check.png');
    
    // Check if any validation is working
    const validationActive = pageContent.hasWalletWarning || 
                            pageContent.hasValidationMessage || 
                            pageContent.hasSmartContract;
    
    if (validationActive) {
      console.log('\n✅ SUCCESS: Validation fix appears to be active!');
      console.log('The form is showing validation-related messages.');
    } else {
      console.log('\n⚠️ WARNING: Validation fix may not be active');
      console.log('The form is not showing expected validation messages.');
      console.log('\nPossible issues:');
      console.log('1. Frontend changes not hot-reloaded');
      console.log('2. Dev server needs restart');
      console.log('3. Build/bundle issue');
      console.log('\nTry: Restart the dev server with "npm run dev"');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\nPress Ctrl+C to close browser and exit...');
  // Keep browser open for manual inspection
  await new Promise(() => {});
}

testValidationFix();