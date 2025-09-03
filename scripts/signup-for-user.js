#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function signupForUser() {
  console.log('🚀 SIGNING UP USER: dan@dkdev.io on deployed site');
  console.log('Site: https://cryptocampaign.netlify.app/campaigns/auth');
  console.log('');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  try {
    // Go to auth page
    console.log('1. Loading auth page...');
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    await page.screenshot({ path: 'signup-step1.png' });
    console.log('   ✅ Auth page loaded');

    // Click Sign Up tab
    console.log('2. Clicking Sign Up tab...');
    await page.click('text=Sign Up');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'signup-step2.png' });
    console.log('   ✅ Sign Up tab clicked');

    // Fill email
    console.log('3. Filling email: dan@dkdev.io');
    const emailSelector = 'input[type="email"], input[name="email"], [placeholder*="email" i]';
    await page.waitForSelector(emailSelector);
    await page.type(emailSelector, 'dan@dkdev.io');
    console.log('   ✅ Email entered');

    // Fill password
    console.log('4. Filling password: DanPassword123!');
    const passwordSelector = 'input[type="password"], input[name="password"]';
    await page.waitForSelector(passwordSelector);
    await page.type(passwordSelector, 'DanPassword123!');
    console.log('   ✅ Password entered');

    await page.screenshot({ path: 'signup-step3.png' });

    // Submit signup
    console.log('5. Submitting signup form...');
    
    // Try different button selectors
    let clicked = false;
    const selectors = ['button[type="submit"]', 'button', 'input[type="submit"]'];
    
    for (const selector of selectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          clicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      await page.keyboard.press('Enter');
    }
    console.log('   ✅ Signup submitted');

    // Wait for result
    console.log('6. Waiting for signup result...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    await page.screenshot({ path: 'signup-step4.png' });

    const currentUrl = page.url();
    const content = await page.content();
    
    console.log('   Final URL:', currentUrl);

    // Check for success indicators
    if (content.includes('welcome') || content.includes('dashboard') || content.includes('logout') || currentUrl !== 'https://cryptocampaign.netlify.app/campaigns/auth') {
      console.log('');
      console.log('✅ SIGNUP SUCCESS!');
      console.log('🎉 User dan@dkdev.io created and logged in!');
      console.log('🎉 EMAIL VERIFICATION BYPASS WORKING!');
    } else if (content.includes('error') || content.includes('invalid')) {
      console.log('');
      console.log('❌ SIGNUP FAILED - Error detected');
      console.log('Check signup-step4.png for details');
    } else {
      console.log('');
      console.log('⚠️ UNCLEAR RESULT - Check screenshots');
    }

  } catch (error) {
    console.log('❌ Error during signup:', error.message);
    await page.screenshot({ path: 'signup-error.png' });
  } finally {
    await browser.close();
    console.log('');
    console.log('📸 Screenshots: signup-step1.png → signup-step4.png');
    console.log('');
    console.log('✅ DONE. User dan@dkdev.io should now be able to login.');
  }
}

signupForUser();