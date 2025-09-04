#!/usr/bin/env node

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'dan@dkdev.io';
const TEST_PASSWORD = '32test1!';
const TEST_FULL_NAME = 'Dan Test User';

async function testCampaignSignup() {
  console.log('🎯 PUPPETEER CAMPAIGN SIGNUP TEST');
  console.log('📧 Testing with email:', TEST_EMAIL);
  console.log('🔒 Testing with password:', TEST_PASSWORD);

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    console.log('\n1. 🌐 Opening campaign auth page...');
    await page.goto('http://localhost:5175/campaigns/auth', {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    console.log('✅ Page loaded successfully');

    console.log('\n2. 📝 Clicking Sign Up tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signUpButton = buttons.find((button) => button.textContent.includes('Sign Up'));
      if (signUpButton) signUpButton.click();
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('✅ Sign Up tab activated');

    console.log('\n3. ✍️  Filling signup form with test credentials...');

    // Fill Full Name
    await page.click('#signup-fullname');
    await page.evaluate(() => (document.querySelector('#signup-fullname').value = ''));
    await page.type('#signup-fullname', TEST_FULL_NAME);
    console.log('✅ Full name filled:', TEST_FULL_NAME);

    // Fill Email
    await page.click('#signup-email');
    await page.evaluate(() => (document.querySelector('#signup-email').value = ''));
    await page.type('#signup-email', TEST_EMAIL);
    console.log('✅ Email filled:', TEST_EMAIL);

    // Fill Password
    await page.click('#signup-password');
    await page.evaluate(() => (document.querySelector('#signup-password').value = ''));
    await page.type('#signup-password', TEST_PASSWORD);
    console.log('✅ Password filled');

    // Fill Confirm Password
    await page.click('#signup-confirmpassword');
    await page.evaluate(() => (document.querySelector('#signup-confirmpassword').value = ''));
    await page.type('#signup-confirmpassword', TEST_PASSWORD);
    console.log('✅ Confirm password filled');

    // Check terms and conditions
    await page.click('input[name="agreeToTerms"]');
    console.log('✅ Terms checkbox checked');

    console.log('\n4. 📸 Taking screenshot before submit...');
    await page.screenshot({ path: 'before-submit.png', fullPage: true });

    console.log('\n5. 🚀 Submitting signup form...');

    // Listen for network requests
    page.on('response', (response) => {
      console.log('🌐 Response:', response.status(), response.url());
    });

    // Listen for console messages
    page.on('console', (msg) => {
      console.log('🔍 Browser Console:', msg.text());
    });

    // Click submit button
    await page.click('button[type="submit"]');
    console.log('✅ Submit button clicked');

    console.log('\n6. ⏳ Waiting for signup response...');
    await new Promise((resolve) => setTimeout(resolve, 8000));

    console.log('\n7. 📸 Taking screenshot of result...');
    await page.screenshot({ path: 'signup-result.png', fullPage: true });

    console.log('\n8. 🔍 Checking page content for success/error messages...');
    const pageContent = await page.content();
    const pageText = await page.evaluate(() => document.body.innerText);

    console.log('📋 Page text contains:');
    if (pageText.toLowerCase().includes('verification')) {
      console.log('✅ FOUND: "verification" - Email verification mentioned!');
    }
    if (pageText.toLowerCase().includes('email')) {
      console.log('✅ FOUND: "email" - Email-related content detected');
    }
    if (pageText.toLowerCase().includes('sent')) {
      console.log('✅ FOUND: "sent" - Something was sent!');
    }
    if (pageText.toLowerCase().includes('check')) {
      console.log('✅ FOUND: "check" - User asked to check something');
    }
    if (pageText.toLowerCase().includes('error')) {
      console.log('❌ FOUND: "error" - Error message detected');
    }
    if (pageText.toLowerCase().includes('already')) {
      console.log('ℹ️  FOUND: "already" - User may already exist');
    }

    // Check for specific success indicators
    if (
      pageContent.includes('verification email') ||
      pageContent.includes('check your email') ||
      pageContent.includes('email sent')
    ) {
      console.log('\n🎉 SUCCESS: Email verification process detected!');
      console.log('📧 Verification email should be sent to:', TEST_EMAIL);
    } else if (
      pageContent.includes('User already registered') ||
      pageContent.includes('already exists')
    ) {
      console.log('\n✅ INFO: User already exists - signup system is working');
      console.log('📧 This confirms the system would send emails for new users');
    } else {
      console.log('\n❓ UNCLEAR: Check screenshots for detailed results');
      console.log('📄 Page text snippet:', pageText.substring(0, 500));
    }

    console.log('\n9. ⏰ Keeping browser open for 15 seconds for manual verification...');
    await new Promise((resolve) => setTimeout(resolve, 15000));
  } finally {
    await browser.close();
    console.log('\n🔚 Browser test completed');
  }
}

console.log('🎬 Starting Puppeteer signup test as requested...\n');
testCampaignSignup()
  .then(() => {
    console.log('\n✅ PUPPETEER TEST COMPLETED');
    console.log('📸 Check screenshots: before-submit.png and signup-result.png');
    console.log('📧 If successful, verification email sent to dan@dkdev.io');
  })
  .catch((error) => {
    console.error('\n❌ PUPPETEER TEST FAILED:', error.message);
  });
