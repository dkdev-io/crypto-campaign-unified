#!/usr/bin/env node

import puppeteer from 'puppeteer';

const NETLIFY_URL = 'https://cryptocampaign.netlify.app';
const TEST_EMAIL = 'dan@dkdev.io';
const TEST_PASSWORD = '32test1!';

async function quickNetlifyTest() {
  console.log('⚡ QUICK NETLIFY TEST - PRODUCTION DEPLOYMENT');
  console.log('🔗 URL:', NETLIFY_URL);
  console.log('📧 Email:', TEST_EMAIL);

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 1000,
    defaultViewport: { width: 1280, height: 720 },
  });

  try {
    const page = await browser.newPage();

    console.log('🌐 Opening Netlify campaigns/auth...');
    await page.goto(`${NETLIFY_URL}/campaigns/auth`, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    console.log('✅ Page loaded');

    // Click signup button
    console.log('🔄 Clicking "Need an account? Sign up"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signupBtn = buttons.find((btn) => btn.textContent.includes('Sign up'));
      if (signupBtn) signupBtn.click();
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fill form quickly
    console.log('✍️ Filling form...');

    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input fields`);

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.evaluate((el) => el.type);
      const name = await input.evaluate((el) => el.name);

      if (type === 'text' || name === 'fullName') {
        await input.click();
        await input.type('Dan Test User');
        console.log('✅ Name filled');
      } else if (type === 'email') {
        await input.click();
        await input.type(TEST_EMAIL);
        console.log('✅ Email filled:', TEST_EMAIL);
      } else if (type === 'password') {
        await input.click();
        await input.type(TEST_PASSWORD);
        console.log('✅ Password filled');
      } else if (type === 'checkbox') {
        await input.click();
        console.log('✅ Checkbox checked');
      }
    }

    await page.screenshot({ path: 'netlify-quick-filled.png' });

    // Submit
    console.log('🚀 Submitting...');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('✅ Submitted');

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const pageText = await page.evaluate(() => document.body.innerText);

      console.log('🔍 NETLIFY RESULT:');
      if (pageText.includes('verification') || pageText.includes('email sent')) {
        console.log('🎉 SUCCESS: Email verification detected on Netlify!');
      } else if (pageText.includes('already')) {
        console.log('ℹ️ User already exists - Netlify system working');
      } else {
        console.log('📄 Response:', pageText.substring(0, 200));
      }

      await page.screenshot({ path: 'netlify-quick-result.png' });
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  } finally {
    await browser.close();
  }
}

quickNetlifyTest()
  .then(() => {
    console.log('✅ NETLIFY PRODUCTION TEST COMPLETED');
  })
  .catch(console.error);
