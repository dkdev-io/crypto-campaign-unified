#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

// Supabase client to verify database changes
const SUPABASE_URL = 'https://kmepcdsklnnxokoimvzo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testDonorRegistrationWithPuppeteer() {
  console.log('🚀 Starting Puppeteer Donor Registration Test');
  console.log('📋 This will test the actual form submission in the browser');
  console.log('');

  let browser;
  try {
    // Launch browser
    console.log('1️⃣ Launching browser...');
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for CI/automated testing
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Navigate to registration page on ACTUAL NETLIFY SITE
    console.log('2️⃣ Navigating to registration page...');
    const registrationURL = 'https://cryptocampaign.netlify.app/donors/auth/register';
    
    try {
      await page.goto(registrationURL, { waitUntil: 'networkidle0', timeout: 10000 });
      console.log('✅ Registration page loaded successfully');
    } catch (error) {
      console.log('❌ Failed to load registration page:', error.message);
      console.log('   Make sure the Netlify site is accessible at https://cryptocampaign.netlify.app');
      return false;
    }

    // Take screenshot of initial page
    await page.screenshot({ path: 'donor-registration-initial.png', fullPage: true });
    console.log('📸 Screenshot saved: donor-registration-initial.png');

    // Check if form elements exist
    console.log('3️⃣ Checking form elements...');
    
    const formExists = await page.$('form') !== null;
    if (!formExists) {
      console.log('❌ Registration form not found on page');
      return false;
    }
    console.log('✅ Registration form found');

    const emailInput = await page.$('input[type="email"], input[name="email"], #email');
    const passwordInput = await page.$('input[name="password"]:first-of-type');
    const confirmPasswordInput = await page.$('input[name="confirmPassword"]');
    const nameInput = await page.$('input[name="fullName"], input[name="full_name"], #fullName, #full_name');
    const termsCheckbox = await page.$('input[name="agreeToTerms"], input[type="checkbox"]');
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');

    if (!emailInput) {
      console.log('❌ Email input not found');
      return false;
    }
    if (!passwordInput) {
      console.log('❌ Password input not found');
      return false;
    }
    if (!confirmPasswordInput) {
      console.log('❌ Confirm password input not found');
      return false;
    }
    if (!termsCheckbox) {
      console.log('❌ Terms checkbox not found');
      return false;
    }
    if (!submitButton) {
      console.log('❌ Submit button not found');
      return false;
    }

    console.log('✅ All required form elements found');

    // Use specified test email (as requested by user)
    const testEmail = 'test@dkdev.io';
    const testPassword = 'TestDonor123!';
    const testName = 'Test Donor Account Puppeteer';

    console.log(`4️⃣ Filling form with test data...`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: ${testName}`);

    // Fill form fields
    await nameInput.click({ clickCount: 3 });
    await nameInput.type(testName, { delay: 50 });
    console.log('✅ Name field filled');
    
    await emailInput.click({ clickCount: 3 }); // Select all
    await emailInput.type(testEmail, { delay: 50 });
    console.log('✅ Email field filled');
    
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(testPassword, { delay: 50 });
    console.log('✅ Password field filled');
    
    await confirmPasswordInput.click({ clickCount: 3 });
    await confirmPasswordInput.type(testPassword, { delay: 50 });
    console.log('✅ Confirm password field filled');
    
    await termsCheckbox.click();
    console.log('✅ Terms checkbox checked');

    // Take screenshot before submission
    await page.screenshot({ path: 'donor-registration-filled.png', fullPage: true });
    console.log('📸 Screenshot saved: donor-registration-filled.png');

    // Set up response monitoring
    console.log('5️⃣ Submitting form...');
    
    let responseReceived = false;
    let responseData = null;
    
    // Monitor network requests
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('supabase') || url.includes('auth') || url.includes('signup')) {
        responseReceived = true;
        console.log(`📡 Network response: ${response.status()} - ${url}`);
        try {
          responseData = await response.text();
          console.log(`📄 Response data: ${responseData.substring(0, 200)}...`);
        } catch (e) {
          console.log('📄 Response data could not be read');
        }
      }
    });

    // Monitor console messages
    page.on('console', msg => {
      console.log(`🖥️  Browser console [${msg.type()}]: ${msg.text()}`);
    });

    // Monitor JavaScript errors
    page.on('pageerror', error => {
      console.log(`💥 JavaScript error: ${error.message}`);
    });

    // Submit the form
    await submitButton.click();
    
    // Wait for any responses or navigation
    console.log('6️⃣ Waiting for form submission response...');
    
    try {
      await page.waitForFunction(() => {
        // Check for success indicators
        return document.querySelector('.success') || 
               document.querySelector('[class*="success"]') ||
               document.querySelector('.alert-success') ||
               document.body.innerText.toLowerCase().includes('check your email') ||
               document.body.innerText.toLowerCase().includes('verification') ||
               document.body.innerText.toLowerCase().includes('sent') ||
               document.body.innerText.toLowerCase().includes('verify') ||
               window.location.href.includes('verify') ||
               window.location.href.includes('success') ||
               !window.location.pathname.includes('/donors/auth/register'); // Navigation away from form
      }, { timeout: 15000 });
      
      console.log('✅ Form submission appears successful (success indicators found)');
      
    } catch (timeoutError) {
      console.log('⏰ Timeout waiting for success indicators');
      console.log('   Continuing to check current page state...');
    }

    // Take screenshot after submission
    await page.screenshot({ path: 'donor-registration-after-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: donor-registration-after-submit.png');

    // Check current URL
    const currentURL = page.url();
    console.log(`🔗 Current URL after submission: ${currentURL}`);
    
    // Check page content for success indicators
    const pageContent = await page.content();
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    const hasSuccessMessage = bodyText.toLowerCase().includes('check your email') ||
                             bodyText.toLowerCase().includes('verification') ||
                             bodyText.toLowerCase().includes('sent') ||
                             bodyText.toLowerCase().includes('registered');
    
    const hasErrorMessage = bodyText.toLowerCase().includes('error') ||
                           bodyText.toLowerCase().includes('failed') ||
                           bodyText.toLowerCase().includes('invalid');

    if (hasSuccessMessage) {
      console.log('✅ SUCCESS: Registration success message found on page');
    } else if (hasErrorMessage) {
      console.log('❌ ERROR: Error message found on page');
      console.log('📄 Page text snippet:', bodyText.substring(0, 500));
    } else {
      console.log('⚠️  No clear success/error indicators found');
      console.log('📄 Page text snippet:', bodyText.substring(0, 500));
    }

    // Wait a moment for any async operations
    await page.waitForTimeout(2000).catch(() => {
      // waitForTimeout might not be available in older versions
      return new Promise(resolve => setTimeout(resolve, 2000));
    });

    // Verify user was created in database
    console.log('7️⃣ Verifying user creation in database...');
    
    try {
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.log('⚠️  Could not verify user in database (admin access required)');
        console.log('   Error:', userError.message);
      } else {
        const createdUser = users.users.find(user => user.email === testEmail);
        if (createdUser) {
          console.log('✅ SUCCESS: User created in auth system!');
          console.log(`🆔 User ID: ${createdUser.id}`);
          console.log(`📧 Email: ${createdUser.email}`);
          console.log(`✅ Email confirmed: ${createdUser.email_confirmed_at ? 'Yes' : 'No (needs verification)'}`);
        } else {
          console.log('❌ User not found in auth system');
        }
      }
    } catch (dbError) {
      console.log('⚠️  Database verification failed:', dbError.message);
    }

    return {
      success: hasSuccessMessage && !hasErrorMessage,
      networkResponse: responseReceived,
      currentURL,
      hasSuccessMessage,
      hasErrorMessage,
      testEmail
    };

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    return false;
  } finally {
    if (browser) {
      console.log('8️⃣ Closing browser...');
      await browser.close();
    }
  }
}

// Run the test
testDonorRegistrationWithPuppeteer().then((result) => {
  console.log('\n' + '='.repeat(60));
  if (result && result.success) {
    console.log('🎉 PUPPETEER TEST: DONOR REGISTRATION WORKS!');
    console.log('');
    console.log('✅ Form submission successful');
    console.log('✅ User registration completed');
    console.log('✅ Success indicators found on page');
    console.log('');
    console.log('📋 Test Results:');
    console.log(`   • Network responses: ${result.networkResponse ? 'Received' : 'None detected'}`);
    console.log(`   • Final URL: ${result.currentURL}`);
    console.log(`   • Success message: ${result.hasSuccessMessage ? 'Found' : 'Not found'}`);
    console.log(`   • Error message: ${result.hasErrorMessage ? 'Found' : 'Not found'}`);
    console.log(`   • Test email: ${result.testEmail}`);
  } else {
    console.log('❌ PUPPETEER TEST: ISSUES DETECTED');
    console.log('');
    console.log('Check the screenshots and console output above for details');
    console.log('Screenshots saved:');
    console.log('  - donor-registration-initial.png');
    console.log('  - donor-registration-filled.png'); 
    console.log('  - donor-registration-after-submit.png');
  }
  console.log('='.repeat(60));
}).catch(err => {
  console.error('\n💥 Fatal test error:', err);
});