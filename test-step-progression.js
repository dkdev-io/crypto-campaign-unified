import puppeteer from 'puppeteer';

async function testStepProgression() {
  console.log('Testing progression through multiple steps...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Get to step 2 first
    await page.goto('https://cryptocampaign.netlify.app/campaigns/auth/setup');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Quick account creation
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.trim() === 'Sign Up') {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.type('input[name="fullName"]', 'Progress Test');
    await page.type('input[name="email"]', `progress${Date.now()}@dkdev.io`);
    await page.type('input[name="password"]', 'TestPassword123!');
    await page.type('input[name="confirmPassword"]', 'TestPassword123!');
    await page.click('input[name="agreeToTerms"]');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    console.log('At step 2, clicking Next to go to step 3...');
    
    // Click Next to go to Step 3
    const nextButtons = await page.$$('button');
    for (let button of nextButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Next') || text.includes('Connect Bank')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check Step 3
    let pageText = await page.evaluate(() => document.body.textContent);
    const isStep3 = pageText.includes('Step 3') || pageText.includes('Bank');
    console.log(`Step 3 reached: ${isStep3}`);
    
    if (!isStep3) {
      console.log('BROKEN: Cannot reach step 3');
      await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step3-failed.png' });
      return false;
    }
    
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step3-success.png' });
    
    // Try to continue to Step 4
    console.log('At step 3, trying to go to step 4...');
    
    const step3Buttons = await page.$$('button');
    for (let button of step3Buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Next') || text.includes('Continue') || text.includes('Skip')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check Step 4
    pageText = await page.evaluate(() => document.body.textContent);
    const isStep4 = pageText.includes('Step 4') || pageText.includes('Website') || pageText.includes('Style');
    console.log(`Step 4 reached: ${isStep4}`);
    
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step4-result.png' });
    
    if (!isStep4) {
      console.log('BROKEN: Cannot reach step 4');
      return false;
    }
    
    console.log('Steps 2 → 3 → 4: WORKING');
    
    // Try one more step to Step 5
    console.log('Attempting step 5...');
    const step4Buttons = await page.$$('button');
    for (let button of step4Buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Next') || text.includes('Continue') || text.includes('Skip')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    pageText = await page.evaluate(() => document.body.textContent);
    const isStep5 = pageText.includes('Step 5') || pageText.includes('Step 6') || pageText.includes('Terms');
    console.log(`Step 5/6 reached: ${isStep5}`);
    
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/step5-result.png' });
    
    return isStep5;
    
  } catch (error) {
    console.error('Step progression failed:', error.message);
    await page.screenshot({ path: '/Users/Danallovertheplace/crypto-campaign-unified/progression-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

testStepProgression().then(success => {
  if (success) {
    console.log('Setup wizard progression through multiple steps: WORKING');
    console.log('Campaign setup workflow is functional through at least 5 steps');
  } else {
    console.log('Setup wizard progression: BROKEN');
    console.log('Campaign setup workflow has issues beyond step 2');
  }
  process.exit(success ? 0 : 1);
});