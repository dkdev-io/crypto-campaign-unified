#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function completeSignup() {
  console.log('🚀 COMPLETING SIGNUP FOR: dan@dkdev.io');
  console.log('');

  const browser = await puppeteer.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  try {
    console.log('1. Loading auth page...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('2. Clicking Sign Up tab...');
    await page.click('text=Sign Up');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('3. Filling full name...');
    await page.type('input[placeholder*="full name"]', 'Dan Developer');

    console.log('4. Filling email...');
    await page.type('input[type="email"]', 'dan@dkdev.io');

    console.log('5. Filling password...');
    await page.type('input[type="password"]:first-of-type', 'DanPassword123!');

    console.log('6. Confirming password...');
    await page.type('input[placeholder*="Confirm"]', 'DanPassword123!');

    console.log('7. Checking terms agreement...');
    await page.click('input[type="checkbox"]');

    await page.screenshot({ path: 'signup-complete-form.png' });

    console.log('8. Submitting completed signup...');
    await page.click('button:has-text("Create Account")');

    console.log('9. Waiting for result...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: 'signup-final-result.png' });

    const url = page.url();
    const content = await page.content();

    console.log('Final URL:', url);

    if (content.includes('welcome') || content.includes('dashboard') || url.includes('dashboard') || url !== 'https://cryptocampaign.netlify.app/campaigns/auth') {
      console.log('✅ SIGNUP SUCCESS! User created and logged in!');
    } else if (content.includes('error')) {
      console.log('❌ SIGNUP FAILED - Check signup-final-result.png');
    } else {
      console.log('⚠️ Check signup-final-result.png for status');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('');
    console.log('✅ DONE. Check screenshots for results.');
    console.log('User should now be able to login with dan@dkdev.io / DanPassword123!');
  }
}

completeSignup();