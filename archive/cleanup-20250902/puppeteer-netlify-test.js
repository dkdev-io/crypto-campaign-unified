#!/usr/bin/env node

import puppeteer from 'puppeteer';

const NETLIFY_URL = 'https://cryptocampaign.netlify.app';
const TEST_EMAIL = 'dan@dkdev.io';
const TEST_PASSWORD = '32test1!';

async function testNetlifySignup() {
  console.log('🌍 PUPPETEER TEST - NETLIFY PRODUCTION DEPLOYMENT');
  console.log('🔗 Testing URL:', NETLIFY_URL);
  console.log('📧 Email:', TEST_EMAIL);
  console.log('🔒 Password:', TEST_PASSWORD);

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1500,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    console.log('\n1. 🌐 Opening Netlify deployment...');
    await page.goto(NETLIFY_URL, {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    const title = await page.title();
    const url = await page.url();
    console.log('✅ Page loaded:', title);
    console.log('🔗 Current URL:', url);

    console.log('\n2. 📸 Taking screenshot of homepage...');
    await page.screenshot({ path: 'netlify-homepage.png', fullPage: true });

    console.log('\n3. 🔍 Looking for campaigns/auth path...');
    // Try to navigate to campaigns auth page
    try {
      await page.goto(`${NETLIFY_URL}/campaigns/auth`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      console.log('✅ Found campaigns/auth page');
    } catch (error) {
      console.log('⚠️ /campaigns/auth not found, looking for auth elements on homepage...');
      await page.goto(NETLIFY_URL);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('\n4. 🔍 Analyzing page for signup elements...');

    // Look for any auth/signup related elements
    const pageContent = await page.content();
    const hasSignup =
      pageContent.toLowerCase().includes('sign up') ||
      pageContent.toLowerCase().includes('signup') ||
      pageContent.toLowerCase().includes('register');
    const hasAuth =
      pageContent.toLowerCase().includes('auth') || pageContent.toLowerCase().includes('login');

    console.log('🔍 Page analysis:');
    console.log('  - Contains signup elements:', hasSignup);
    console.log('  - Contains auth elements:', hasAuth);

    // Find all buttons and forms
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map((btn) => ({
        text: btn.textContent.trim(),
        id: btn.id,
        className: btn.className,
      }));
    });

    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map((input) => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
      }));
    });

    console.log('\n📋 Found buttons:', buttons.length);
    buttons.forEach((btn, i) => {
      if (btn.text) console.log(`  ${i + 1}. "${btn.text}"`);
    });

    console.log('\n📋 Found inputs:', inputs.length);
    inputs.forEach((input, i) => {
      console.log(`  ${i + 1}. ${input.type} (${input.name || input.id || 'no name'})`);
    });

    console.log('\n5. 📸 Taking screenshot of current page...');
    await page.screenshot({ path: 'netlify-auth-page.png', fullPage: true });

    // Try to find and interact with signup form
    console.log('\n6. 🔍 Looking for signup form elements...');

    try {
      // Look for email input
      const emailInput = await page.$(
        'input[type="email"], input[name="email"], #email, #signup-email'
      );
      if (emailInput) {
        console.log('✅ Found email input field');

        // Try to find signup/register button first
        const signupButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons
            .filter(
              (btn) =>
                btn.textContent.toLowerCase().includes('sign up') ||
                btn.textContent.toLowerCase().includes('signup') ||
                btn.textContent.toLowerCase().includes('register')
            )
            .map((btn) => btn.textContent.trim());
        });

        if (signupButtons.length > 0) {
          console.log('✅ Found signup buttons:', signupButtons);

          // Click first signup button
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const signupBtn = buttons.find(
              (btn) =>
                btn.textContent.toLowerCase().includes('sign up') ||
                btn.textContent.toLowerCase().includes('signup') ||
                btn.textContent.toLowerCase().includes('register')
            );
            if (signupBtn) signupBtn.click();
          });

          await new Promise((resolve) => setTimeout(resolve, 2000));
          console.log('✅ Clicked signup button');
        }

        console.log('\n7. ✍️ Filling form with test credentials...');

        // Fill email
        await emailInput.click();
        await emailInput.evaluate((el) => (el.value = ''));
        await emailInput.type(TEST_EMAIL);
        console.log('✅ Email filled:', TEST_EMAIL);

        // Look for password field
        const passwordInput = await page.$(
          'input[type="password"], input[name="password"], #password'
        );
        if (passwordInput) {
          await passwordInput.click();
          await passwordInput.evaluate((el) => (el.value = ''));
          await passwordInput.type(TEST_PASSWORD);
          console.log('✅ Password filled');
        }

        // Look for other required fields
        const nameInput = await page.$(
          'input[name="fullName"], input[name="name"], #fullName, #name'
        );
        if (nameInput) {
          await nameInput.click();
          await nameInput.evaluate((el) => (el.value = ''));
          await nameInput.type('Dan Test User');
          console.log('✅ Name filled');
        }

        // Look for terms checkbox
        const termsCheckbox = await page.$(
          'input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="agree"]'
        );
        if (termsCheckbox) {
          await termsCheckbox.click();
          console.log('✅ Terms checkbox checked');
        }

        console.log('\n8. 📸 Taking screenshot with filled form...');
        await page.screenshot({ path: 'netlify-form-filled.png', fullPage: true });

        console.log('\n9. 🚀 Submitting form...');
        const submitButton = await page.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          console.log('✅ Submit button clicked');

          console.log('\n10. ⏳ Waiting for response...');
          await new Promise((resolve) => setTimeout(resolve, 8000));

          console.log('\n11. 📸 Taking final result screenshot...');
          await page.screenshot({ path: 'netlify-result.png', fullPage: true });

          // Check for success/error messages
          const finalContent = await page.evaluate(() => document.body.innerText);
          console.log('\n🔍 NETLIFY TEST RESULTS:');

          if (
            finalContent.toLowerCase().includes('verification') ||
            finalContent.toLowerCase().includes('email sent')
          ) {
            console.log('🎉 SUCCESS: Email verification process detected on Netlify!');
          } else if (finalContent.toLowerCase().includes('already')) {
            console.log('ℹ️ INFO: User already exists - Netlify system working');
          } else if (finalContent.toLowerCase().includes('error')) {
            console.log('❌ ERROR: Error message detected');
            console.log('Error details:', finalContent.substring(0, 300));
          } else {
            console.log('📄 Page response preview:');
            console.log(finalContent.substring(0, 500));
          }
        } else {
          console.log('❌ No submit button found');
        }
      } else {
        console.log('❌ No email input found on this page');
        console.log('📄 Current page may not have signup form');
      }
    } catch (formError) {
      console.log('❌ Form interaction failed:', formError.message);
    }

    console.log('\n📸 Screenshots saved:');
    console.log('  - netlify-homepage.png');
    console.log('  - netlify-auth-page.png');
    console.log('  - netlify-form-filled.png (if form found)');
    console.log('  - netlify-result.png (if submitted)');

    console.log('\n⏰ Keeping browser open for 10 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } finally {
    await browser.close();
    console.log('\n🔚 Netlify test completed');
  }
}

console.log('🚀 STARTING NETLIFY PUPPETEER TEST...\n');
testNetlifySignup()
  .then(() => {
    console.log('\n✅ NETLIFY TEST COMPLETED');
    console.log('📧 Tested with dan@dkdev.io and 32test1! on production Netlify deployment');
  })
  .catch((error) => {
    console.error('\n❌ NETLIFY TEST FAILED:', error.message);
  });
