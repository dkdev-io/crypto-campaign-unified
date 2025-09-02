#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function runTest() {
  console.log('🎯 PUPPETEER TEST - Using dan@dkdev.io and 32test1! as requested');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 2000, // Very slow for visibility
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Opening http://localhost:5175/campaigns/auth');
    await page.goto('http://localhost:5175/campaigns/auth');
    
    console.log('⏳ Waiting for page load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'test-1-loaded.png' });
    
    console.log('🔄 Clicking Sign Up tab...');
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Sign Up')) {
          button.click();
          break;
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📸 Taking screenshot after Sign Up click...');
    await page.screenshot({ path: 'test-2-signup-tab.png' });
    
    console.log('✍️ Filling form with requested credentials...');
    console.log('   📧 Email: dan@dkdev.io');
    console.log('   🔒 Password: 32test1!');
    
    // Fill form fields
    await page.evaluate(() => {
      const fullNameInput = document.querySelector('#signup-fullname');
      if (fullNameInput) {
        fullNameInput.value = 'Dan Test User';
        fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('#signup-email');
      if (emailInput) {
        emailInput.value = 'dan@dkdev.io';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await page.evaluate(() => {
      const passwordInput = document.querySelector('#signup-password');
      if (passwordInput) {
        passwordInput.value = '32test1!';
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await page.evaluate(() => {
      const confirmInput = document.querySelector('#signup-confirmpassword');
      if (confirmInput) {
        confirmInput.value = '32test1!';
        confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
    await page.evaluate(() => {
      const termsInput = document.querySelector('input[name="agreeToTerms"]');
      if (termsInput && !termsInput.checked) {
        termsInput.click();
      }
    });
    
    console.log('✅ Form filled with test credentials');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📸 Taking screenshot of filled form...');
    await page.screenshot({ path: 'test-3-form-filled.png' });
    
    console.log('🚀 Submitting form...');
    await page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.click();
      }
    });
    
    console.log('⏳ Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: 'test-4-result.png' });
    
    // Check result
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('\n🔍 RESULTS:');
    
    if (pageText.includes('verification') || pageText.includes('email sent')) {
      console.log('🎉 SUCCESS: Email verification process detected!');
    } else if (pageText.includes('already')) {
      console.log('ℹ️  User already exists - system working correctly');
    } else {
      console.log('📄 Page content snippet:');
      console.log(pageText.substring(0, 300));
    }
    
    console.log('\n📸 Screenshots created:');
    console.log('  - test-1-loaded.png (page loaded)');
    console.log('  - test-2-signup-tab.png (after clicking signup)');
    console.log('  - test-3-form-filled.png (form filled)');
    console.log('  - test-4-result.png (final result)');
    
    console.log('\n⏰ Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } finally {
    await browser.close();
  }
}

console.log('🎬 PUPPETEER VERIFICATION TEST STARTING...\n');
runTest().then(() => {
  console.log('\n✅ PUPPETEER TEST COMPLETED');
  console.log('📧 Tested with dan@dkdev.io and 32test1! as requested');
}).catch(error => {
  console.error('❌ Test failed:', error.message);
});