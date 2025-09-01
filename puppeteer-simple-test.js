#!/usr/bin/env node

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'dan@dkdev.io';
const TEST_PASSWORD = '32test1!';
const TEST_FULL_NAME = 'Dan Test User';

async function runPuppeteerTest() {
  console.log('🎯 PUPPETEER SIGNUP TEST - SIMPLIFIED VERSION');
  console.log('📧 Email:', TEST_EMAIL);
  console.log('🔒 Password:', TEST_PASSWORD);
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🌐 Opening campaign auth page...');
    await page.goto('http://localhost:5175/campaigns/auth');
    
    console.log('⏳ Waiting 3 seconds for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of loaded page
    await page.screenshot({ path: 'page-loaded.png' });
    console.log('📸 Screenshot taken: page-loaded.png');
    
    console.log('🔍 Looking for signup form elements...');
    
    // Try to find signup form fields
    try {
      await page.waitForSelector('input[name="email"], #signup-email', { timeout: 5000 });
      console.log('✅ Found email field');
      
      await page.waitForSelector('input[name="password"], #signup-password', { timeout: 5000 });
      console.log('✅ Found password field');
      
      // Fill the form
      console.log('✍️  Filling form with test credentials...');
      
      // Clear and fill email
      const emailSelector = await page.$('input[name="email"], #signup-email');
      if (emailSelector) {
        await emailSelector.click({ clickCount: 3 });
        await emailSelector.type(TEST_EMAIL);
        console.log('✅ Email filled:', TEST_EMAIL);
      }
      
      // Clear and fill password  
      const passwordSelector = await page.$('input[name="password"], #signup-password');
      if (passwordSelector) {
        await passwordSelector.click({ clickCount: 3 });
        await passwordSelector.type(TEST_PASSWORD);
        console.log('✅ Password filled');
      }
      
      // Try to fill full name if exists
      const nameSelector = await page.$('input[name="fullName"], #signup-fullname');
      if (nameSelector) {
        await nameSelector.click({ clickCount: 3 });
        await nameSelector.type(TEST_FULL_NAME);
        console.log('✅ Full name filled');
      }
      
      // Try to fill confirm password if exists
      const confirmSelector = await page.$('input[name="confirmPassword"], #signup-confirmpassword');
      if (confirmSelector) {
        await confirmSelector.click({ clickCount: 3 });
        await confirmSelector.type(TEST_PASSWORD);
        console.log('✅ Confirm password filled');
      }
      
      // Try to check terms checkbox if exists
      const termsSelector = await page.$('input[name="agreeToTerms"]');
      if (termsSelector) {
        await termsSelector.click();
        console.log('✅ Terms checkbox checked');
      }
      
      console.log('🚀 Submitting form...');
      
      // Find and click submit button
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Submit button clicked');
        
        console.log('⏳ Waiting for response...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Take screenshot of result
        await page.screenshot({ path: 'signup-result.png' });
        console.log('📸 Result screenshot: signup-result.png');
        
        // Check for success/error messages
        const pageContent = await page.content();
        
        if (pageContent.includes('verification') || pageContent.includes('email sent')) {
          console.log('🎉 SUCCESS: Email verification message detected!');
        } else if (pageContent.includes('error') || pageContent.includes('failed')) {
          console.log('❌ ERROR: Error message detected');
        } else {
          console.log('❓ UNCLEAR: Check screenshots for result');
        }
        
      } else {
        console.log('❌ Submit button not found');
      }
      
    } catch (error) {
      console.log('❌ Form interaction failed:', error.message);
    }
    
    console.log('⏳ Keeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run the test
runPuppeteerTest().catch(console.error);